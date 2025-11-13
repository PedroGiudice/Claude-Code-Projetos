# Windows Permission Fix - Claude Code CLI

## Problem Summary

Claude Code CLI on Windows may freeze during startup due to EPERM (permission denied) errors when trying to create lock files. This happens when:

- Windows Defender is actively scanning files
- User directory has restrictive permissions
- Stale lock files exist from crashed sessions

**Symptoms:**
- CLI starts and hooks execute successfully
- Interface appears but cannot type (stdin blocked)
- Logs show repeated `EPERM` errors: `Failed to save config with lock`

## Root Cause

This is a **bug in Claude Code CLI's file locking mechanism**:
1. CLI attempts to create `C:\Users\<user>\.claude.json.lock`
2. Windows denies permission (EPERM)
3. CLI falls back to non-atomic write (succeeds)
4. **BUG**: CLI continues retrying atomic write infinitely
5. No backoff, no error limit
6. Event loop blocked → stdin frozen

**Important**: The SessionStart hooks are working correctly. This is not a hooks issue.

## Solution: PowerShell Repair Script

We've created `fix-claude-permissions.ps1` to diagnose and fix this issue automatically.

### Basic Usage

```powershell
# Navigate to repository
cd C:\claude-work\repos\Claude-Code-Projetos

# Run the fix script
.\fix-claude-permissions.ps1
```

### Advanced Usage (with Defender Exclusion)

```powershell
# Right-click PowerShell → Run as Administrator
# Then:
cd C:\claude-work\repos\Claude-Code-Projetos
.\fix-claude-permissions.ps1 -AddDefenderExclusion
```

## What the Script Does

1. **Detects Environment**
   - Identifies Claude config location
   - Checks for admin privileges

2. **Tests for Permission Issues**
   - Attempts to create test lock directory
   - Reports if EPERM errors occur

3. **Clears Stale Locks**
   - Finds any `*.claude.json.*` lock files/directories
   - Removes them safely

4. **Fixes File Permissions**
   - Creates `.claude.json` if missing
   - Grants full control to current user
   - Uses Windows ACL (Access Control Lists)

5. **Adds Defender Exclusion** (optional, requires Admin)
   - Excludes `.claude.json` from real-time scanning
   - Prevents future EPERM errors

6. **Verifies Fix**
   - Tests lock creation one final time
   - Reports success or failure

## Expected Output

### Successful Repair

```
============================================
Claude Code Permission Repair Utility
============================================

[i] Detecting environment...
[i] User: pedro
[i] Config: C:\Users\pedro\.claude.json
[!] Running with standard user privileges

[i] Checking for permission issues...
[!] Permission issue detected (EPERM)

[i] Checking for stale lock files...
[!] Found 2 stale lock file(s)
[✓] Removed: .claude.json.lock
[✓] Removed: .claude.json.tmp.12345.1699876543210

[i] Repairing file permissions...
[✓] Permissions fixed for: C:\Users\pedro\.claude.json

[i] Verifying fix...
[✓] Lock creation test: PASSED

============================================
SUMMARY
============================================
[✓] All checks passed! Claude Code should work now.

You can now run: claude
```

### If Issues Remain

```
[✗] Lock creation test: FAILED

============================================
SUMMARY
============================================
[!] Some issues remain. See details above.

Try running as Administrator:
  Right-click PowerShell → Run as Administrator
  Then run: .\fix-claude-permissions.ps1 -AddDefenderExclusion
```

## Manual Fix (if script fails)

### 1. Clear Stale Locks Manually

```powershell
cd $env:USERPROFILE
Get-ChildItem -Filter ".claude.json.*" | Remove-Item -Force -Recurse
```

### 2. Fix Permissions Manually

```powershell
$path = "$env:USERPROFILE\.claude.json"

# Get ACL
$acl = Get-Acl $path

# Add full control for current user
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $env:USERNAME, "FullControl", "Allow"
)
$acl.SetAccessRule($rule)

# Apply
Set-Acl -Path $path -AclObject $acl
```

### 3. Add Defender Exclusion Manually (requires Admin)

```powershell
Add-MpPreference -ExclusionPath "$env:USERPROFILE\.claude.json"
```

## Testing the Fix

After running the script:

```powershell
# Test 1: Can we create a lock directory?
mkdir "$env:USERPROFILE\.claude.json.test"
# Should succeed without errors

# Clean up
rmdir "$env:USERPROFILE\.claude.json.test"

# Test 2: Launch Claude Code
cd C:\claude-work\repos\Claude-Code-Projetos
claude
# Should start without freezing
```

## When to Run This Script

Run the fix script:
- ✅ Before first use of Claude Code CLI on Windows
- ✅ After any Windows Defender updates
- ✅ After any Windows security policy changes
- ✅ Whenever CLI starts freezing again

## Reporting to Anthropic

If this script fixes your issue, the underlying bug still exists in Claude Code CLI. Consider reporting it:

**Bug Report Template:**

```
Title: Windows CLI freezes due to infinite EPERM retry loop

Environment:
- OS: Windows 10/11
- Claude Code CLI: v2.0.31
- Location: C:\Users\<user>\.claude.json

Reproduction:
1. Configure SessionStart hooks
2. Launch `claude` in project directory
3. Hooks execute successfully but CLI freezes (stdin unresponsive)
4. DEBUG logs show ~20+ EPERM errors trying to create .lock files

Root Cause:
CLI enters infinite retry loop when lock file creation fails with EPERM.
Fallback succeeds but atomic write keeps retrying without backoff.

Expected Behavior:
- Retry with exponential backoff (e.g., 3 attempts max)
- OR: Skip atomic write entirely after fallback succeeds
- OR: Allow user to disable file locking via config

Logs:
[Attach DEBUG logs showing EPERM pattern]

Workaround:
Fix Windows permissions via PowerShell script (see attached)
```

## Additional Resources

- **Bug Analysis**: `/tmp/bug-validation-report.md` (after running hooks)
- **Root Cause**: `/tmp/root-cause-analysis.md`
- **Hook Logs**: Enable DEBUG mode in Claude Code settings

## FAQ

**Q: Will this script break anything?**
A: No. It only modifies permissions on `.claude.json` (Claude's own config file).

**Q: Do I need to run this every time?**
A: No. Once permissions are fixed, they should stay fixed unless Windows updates security policies.

**Q: Can I run this on Linux/Mac?**
A: No, this is Windows-specific. Linux/Mac don't experience this bug.

**Q: Is this a security risk?**
A: No. You're granting permissions to yourself (current user) on your own config file.

**Q: What if I don't have admin privileges?**
A: The basic fix works without admin. Only the Defender exclusion requires admin.

## Support

If this script doesn't resolve your issue, check:
1. Antivirus settings (may be blocking file operations)
2. Corporate security policies (may restrict ACL changes)
3. Disk errors (run `chkdsk C: /f`)

---

**Last updated:** 2025-11-13
**Tested on:** Windows 10, Windows 11
**Claude Code CLI:** v2.0.31
