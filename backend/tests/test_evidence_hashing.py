import pytest
import hashlib
from app.services.evidence_service import EvidenceHashService

def test_evidence_hash_generation():
    sample_data = b"TACTICAL_BORDER_SURVEILLANCE_FRAME_CHUNK_2026"
    expected_hash = hashlib.sha256(sample_data).hexdigest()
    calculated = EvidenceHashService.calculate_bytes_sha256(sample_data)
    assert calculated == expected_hash
    assert len(calculated) == 64

def test_tamper_detection_on_different_bytes():
    orig_data = b"FRAME_01_UNCHANGED"
    tampered_data = b"FRAME_01_TAMPERED"
    hash1 = EvidenceHashService.calculate_bytes_sha256(orig_data)
    hash2 = EvidenceHashService.calculate_bytes_sha256(tampered_data)
    assert hash1 != hash2
