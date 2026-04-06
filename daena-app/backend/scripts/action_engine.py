import platform
import subprocess
import json

class ActionEngine:
    """
    Executes actions on the operating system gracefully without raw PyAutoGUI coordinates if possible.
    """
    def __init__(self):
        self.os_type = platform.system()

    async def execute(self, action: dict) -> dict:
        """
        action format:
        {
            "type": "click" | "type" | "scroll" | "hotkey" | "script",
            "target": "element_id veya bounding_box",
            "value": "text to type or script to run",
            "strategy": "native" | "coordinate" | "script"
        }
        """
        strategy = action.get("strategy", "script")

        if strategy == "script":
            return await self._script_action(action)
        elif strategy == "native":
            return {"error": "Native action not fully implemented. Use script."}
        elif strategy == "coordinate":
            # Fallback to PyAutoGUI
            try:
                import pyautogui
                if action["type"] == "click":
                    x, y = action["target"]
                    pyautogui.click(x, y)
                elif action["type"] == "type":
                    pyautogui.write(action["value"], interval=0.01)
                return {"success": True}
            except Exception as e:
                return {"success": False, "error": str(e)}

        return {"success": False, "error": "Unknown strategy"}

    async def _script_action(self, action: dict) -> dict:
        if self.os_type == "Darwin":
            script = action.get("value", "")
            try:
                # Execution via AppleScript
                result = subprocess.run(
                    ["osascript", "-e", script],
                    capture_output=True, text=True, timeout=30
                )
                return {"success": result.returncode == 0, "output": result.stdout}
            except Exception as e:
                return {"success": False, "error": str(e)}
        elif self.os_type == "Windows":
            script = action.get("value", "")
            try:
                result = subprocess.run(
                    ["powershell", "-Command", script],
                    capture_output=True, text=True, timeout=30
                )
                return {"success": result.returncode == 0, "output": result.stdout}
            except Exception as e:
                return {"success": False, "error": str(e)}
        return {"success": False, "error": "Unsupported OS"}
