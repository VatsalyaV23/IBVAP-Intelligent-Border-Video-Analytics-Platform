import pytest
from app.services.blockchain_service import LocalLedgerProvider

def test_merkle_root_calculation():
    hashes = [
        "7a91e82c4f01ba3485c219904791a8e0f117cbb8985c4930129a75d5069cd891",
        "0x7a91e82c4f01ba3485c219904791a8e0f117cbb8985c4930129a75d5069cd891"
    ]
    merkle_root = LocalLedgerProvider.calculate_merkle_root(hashes)
    assert merkle_root.startswith("0x")
    assert len(merkle_root) == 66

def test_merkle_root_empty_block():
    empty_root = LocalLedgerProvider.calculate_merkle_root([])
    assert empty_root.startswith("0x")
