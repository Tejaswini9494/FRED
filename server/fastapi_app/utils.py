"""
Utility functions for FastAPI application.

This module provides helper functions for the FastAPI application.
"""

import os
import json
import subprocess
from typing import List, Any, Dict
import sys
from pathlib import Path

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
    try:
        # Construct the path to the Python script
        script_path = Path(__file__).parent.parent / "python" / script_name
        
        # Ensure the script exists
        if not script_path.exists():
            raise FileNotFoundError(f"Script {script_name} not found at {script_path}")
        
        # Run the script as a subprocess
        cmd = [sys.executable, str(script_path)] + args
        print(f"Running command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        # Parse the JSON output
        if result.stdout.strip():
            return json.loads(result.stdout)
        else:
            return {}
    
    except subprocess.CalledProcessError as e:
        # Handle script execution errors
        error_message = e.stderr if e.stderr else f"Script {script_name} failed with exit code {e.returncode}"
        print(f"Error running script: {error_message}")
        
        # Try to parse any JSON error output
        if e.stdout and e.stdout.strip():
            try:
                return json.loads(e.stdout)
            except json.JSONDecodeError:
                pass
        
        # Return error as JSON
        return {"error": error_message}
    
    except json.JSONDecodeError as e:
        # Handle JSON parsing errors
        error_message = f"Failed to parse JSON output from script {script_name}: {str(e)}"
        print(error_message)
        return {"error": error_message}
    
    except Exception as e:
        # Handle any other errors
        error_message = f"Error running {script_name}: {str(e)}"
        print(error_message)
        return {"error": error_message}