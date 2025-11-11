#!/bin/bash
# Simple script to run the FastAPI server

echo "Starting Stress Analysis API server..."
echo "Server will be available at http://localhost:8000"
echo "API documentation at http://localhost:8000/docs"
echo ""

uvicorn main:app --reload --port 8000

