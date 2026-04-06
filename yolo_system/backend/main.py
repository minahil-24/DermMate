import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from inference import YOLOInference
import uvicorn
from pathlib import Path

app = FastAPI(title="DermMate AI Inference Server")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model configuration
def get_model_path():
    local_path = os.path.join(os.getcwd(), "runs", "detect", "train", "weights", "best.pt")
    if os.path.exists(local_path):
        return local_path
    return "yolov8n.pt"

MODEL_PATH = get_model_path()
print(f"AI Server initializing with model: {MODEL_PATH}")

try:
    yolo_model = YOLOInference(MODEL_PATH)
except Exception as e:
    print(f"Error loading model {MODEL_PATH}: {e}")
    yolo_model = None

@app.post("/predict")
async def predict(
    file: UploadFile = File(...), 
    conf: float = 0.25
):
    """
    Stateless endpoint to receive an image and return YOLO detection results.
    """
    if not yolo_model:
        raise HTTPException(status_code=500, detail="AI model not loaded on server.")
    
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are supported.")

    try:
        contents = await file.read()
        results = yolo_model.predict(contents, conf=conf)
        return results
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "model": MODEL_PATH,
        "service": "DermMate AI Inference"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
