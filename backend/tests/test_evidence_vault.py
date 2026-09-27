import pytest
import os
import uuid
from datetime import datetime, timezone
from app.core.database import AsyncSessionLocal, engine, Base
from main import _auto_migrate_schema
from app.models.evidence import EvidenceItem
from app.api.evidence import (
    list_evidence, delete_evidence, delete_all_evidence,
    admin_login, get_admin_archive, restore_evidence, admin_purge_evidence
)
from app.schemas.common import AdminLoginRequest

@pytest.mark.asyncio
async def test_evidence_soft_delete_and_admin_archive():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_auto_migrate_schema)

    async with AsyncSessionLocal() as db:
        # Seed a test evidence item with unique ID
        ev_id = f"EV-TEST-VAULT-{uuid.uuid4().hex[:8]}"
        ev = EvidenceItem(
            id=ev_id,
            incident_id="INC-TEST-001",
            camera_id="CAM-01",
            evidence_type="EVENT_FRAME",
            file_path="storage/evidence/test.jpg",
            file_size_bytes=1024,
            mime_type="image/jpeg",
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            status="CAPTURED",
            owner_username="operator",
            is_deleted_by_user=0
        )
        db.add(ev)
        await db.commit()

        # 1. Operator lists active evidence
        active_items = await list_evidence(db=db, user=None)
        assert any(i.id == ev_id for i in active_items)

        # 2. Operator soft-deletes evidence
        del_res = await delete_evidence(evidence_id=ev_id, db=db, user=None)
        assert del_res["status"] == "SUCCESS"

        # 3. Active list no longer contains soft-deleted item
        active_items_after = await list_evidence(db=db, user=None)
        assert not any(i.id == ev_id for i in active_items_after)

        # 4. Admin authenticates with DonCasino credentials
        admin_res = await admin_login(
            req=AdminLoginRequest(username="DonCasino", password="Don12345@6789"),
            db=db
        )
        assert admin_res["status"] == "SUCCESS"

        # 5. Admin Archive retrieves soft-deleted item with full attribution
        archive_items = await get_admin_archive(db=db, user=None)
        archived_ev = next((i for i in archive_items if i.id == ev_id), None)
        assert archived_ev is not None
        assert bool(archived_ev.is_deleted_by_user) is True
        assert archived_ev.deleted_by_username == "operator"

        # 6. Admin restores evidence back to operator view
        restore_res = await restore_evidence(evidence_id=ev_id, db=db, user=None)
        assert restore_res["status"] == "SUCCESS"

        active_items_restored = await list_evidence(db=db, user=None)
        assert any(i.id == ev_id for i in active_items_restored)

        # 7. Admin permanent purge
        purge_res = await admin_purge_evidence(evidence_id=ev_id, db=db, user=None)
        assert purge_res["status"] == "SUCCESS"

        all_archive = await get_admin_archive(db=db, user=None)
        assert not any(i.id == ev_id for i in all_archive)
