import os
import json
import subprocess
from pathlib import Path
from typing import List, Any, Dict, Optional


async def run_python_script(script_name: str, args: List[str] = []) -> Any:
    """
    Run a Python script and return the JSON output.
    
    Args:
        script_name: Name of the Python script to run
        args: Command line arguments to pass to the script
        
    Returns:
        Parsed JSON output from the script
        
    Raises:
        Exception: If the script fails to run or produces invalid JSON
    """
    # Get the path to the Python scripts directory
    current_dir = Path(__file__).parent
    script_path = current_dir.parent / "python" / script_name
    
    # Check if the script exists
    if not script_path.exists():
        raise FileNotFoundError(f"Python script not found: {script_path}")
    
    # Run the script
    process = subprocess.Popen(
        ["python", str(script_path), *args],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        raise Exception(f"Python script exited with code {process.returncode}: {stderr}")
    
    try:
        # Parse the JSON output
        return json.loads(stdout)
    except json.JSONDecodeError:
        raise Exception(f"Failed to parse Python script output: {stdout}")