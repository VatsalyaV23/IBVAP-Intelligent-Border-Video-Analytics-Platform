import os
import hashlib
import torch
from typing import Dict, Any, Optional
from ai_engine.core.base_adapters import ModelProvenance

class ModelRegistry:
    def __init__(self):
        self._models = {}
        self.device = self._resolve_device()

    def _resolve_device(self) -> str:
        if torch.cuda.is_available():
            return "CUDA"
        return "CPU"

    def register_model(
        self,
        name: str,
        version: str,
        framework: str,
        weights_path: Optional[str] = None
    ) -> ModelProvenance:
        if weights_path and os.path.exists(weights_path):
            with open(weights_path, "rb") as f:
                model_hash = hashlib.sha256(f.read()).hexdigest()
        else:
            model_hash = hashlib.sha256(f"{name}:{version}:{framework}".encode('utf-8')).hexdigest()

        prov = ModelProvenance(
            model_name=name,
            model_version=version,
            model_hash=model_hash,
            framework=framework,
            device=self.device
        )
        self._models[name] = prov
        return prov

    def get_provenance(self, name: str) -> Optional[ModelProvenance]:
        return self._models.get(name)

model_registry = ModelRegistry()
