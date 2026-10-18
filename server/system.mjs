import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
export const platform = os.platform();
export const userFonts =
  platform === "win32"
    ? path.join(
        process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"),
        "Microsoft",
        "Windows",
        "Fonts",
      )
    : platform === "darwin"
      ? path.join(os.homedir(), "Library", "Fonts")
      : path.join(os.homedir(), ".local", "share", "fonts");
export const systemFonts =
  platform === "win32"
    ? [path.join(process.env.WINDIR || "C:\\Windows", "Fonts")]
    : platform === "darwin"
      ? ["/Library/Fonts", "/System/Library/Fonts"]
      : ["/usr/share/fonts", "/usr/local/share/fonts"];
export async function chooseFolder() {
  if (platform === "win32") {
    const { stdout } = await exec(
      "powershell.exe",
      [
        "-NoProfile",
        "-STA",
        "-Command",
        "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'EasyFonts — Scegli una cartella di font'; if ($dialog.ShowDialog() -eq 'OK') { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Write-Output $dialog.SelectedPath }",
      ],
      { timeout: 300000, windowsHide: true },
    );
    return stdout.trim();
  }
  if (platform === "darwin") {
    try {
      return (
        await exec(
          "osascript",
          [
            "-e",
            'POSIX path of (choose folder with prompt "EasyFonts — Scegli una cartella di font")',
          ],
          { timeout: 300000 },
        )
      ).stdout.trim();
    } catch (e) {
      if (e.stderr?.includes("-128")) return "";
      throw e;
    }
  }
  try {
    return (
      await exec(
        "zenity",
        ["--file-selection", "--directory", "--title=EasyFonts"],
        { timeout: 300000 },
      )
    ).stdout.trim();
  } catch (e) {
    if (e.code === 1) return "";
    throw new Error(
      "Selettore cartelle non disponibile. Installa zenity oppure usa Upload.",
    );
  }
}
export async function registerFont(file, name, remove = false) {
  if (platform === "win32") {
    // Values travel as base64 JSON, never as executable PowerShell text.
    const payload = Buffer.from(
      JSON.stringify({ file, name, remove }),
    ).toString("base64");
    const script = `$ErrorActionPreference = 'Stop'
$p = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${payload}')) | ConvertFrom-Json
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class EasyFontsNative {
[DllImport("gdi32.dll", CharSet=CharSet.Unicode)] public static extern int AddFontResourceW(string file);
[DllImport("gdi32.dll", CharSet=CharSet.Unicode)] public static extern bool RemoveFontResourceW(string file);
[DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)] public static extern IntPtr SendMessageTimeoutW(IntPtr h,uint m,UIntPtr w,IntPtr l,uint f,uint t,out UIntPtr result);
}
'@
$key = 'HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Fonts'
if ($p.remove) {
  [void][EasyFontsNative]::RemoveFontResourceW($p.file)
  if (Test-Path $key) {
    $reg = Get-Item $key
    foreach ($valueName in $reg.GetValueNames()) {
      $value = [string]$reg.GetValue($valueName)
      if ($value -eq $p.file -or $value -eq [IO.Path]::GetFileName($p.file)) { Remove-ItemProperty -LiteralPath $key -Name $valueName }
    }
  }
} else {
  if ([EasyFontsNative]::AddFontResourceW($p.file) -eq 0) { throw 'Windows non ha accettato il font.' }
  [void](New-Item -Path $key -Force)
  [void](New-ItemProperty -LiteralPath $key -Name $p.name -Value $p.file -PropertyType String -Force)
}
$result = [UIntPtr]::Zero
[void][EasyFontsNative]::SendMessageTimeoutW([IntPtr]65535,0x001D,[UIntPtr]::Zero,[IntPtr]::Zero,2,1000,[ref]$result)`;
    await exec(
      "powershell.exe",
      [
        "-NoProfile",
        "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64"),
      ],
      { windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 },
    );
  } else if (platform === "linux")
    await exec("fc-cache", ["-f", userFonts], { timeout: 30000 });
}
export async function availableDirectories() {
  const dirs = [];
  for (const d of [...systemFonts, userFonts]) {
    try {
      await fs.access(d);
      dirs.push(d);
    } catch {}
  }
  return dirs;
}
