@echo off
setlocal
set PYTHON_EXE=C:\envs\gfr-backend\python.exe

if not exist "%PYTHON_EXE%" (
  echo Conda environment python not found at %PYTHON_EXE%
  exit /b 1
)

"%PYTHON_EXE%" -m pip install -e .[dev]
