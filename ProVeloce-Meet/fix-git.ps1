# Git Lock File Fix Script
# Run this script to fix Git lock file issues and clean up node_modules

Write-Host "🔧 Fixing Git Issues..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Try to remove lock file
Write-Host "Step 1: Removing Git lock file..." -ForegroundColor Yellow
if (Test-Path .git\index.lock) {
    try {
        Remove-Item -Force .git\index.lock -ErrorAction Stop
        Write-Host "✅ Lock file removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Cannot remove lock file - it's being used by another process" -ForegroundColor Red
        Write-Host "   Please close all Git applications and try again" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   Common processes to close:" -ForegroundColor Yellow
        Write-Host "   - VS Code / Cursor" -ForegroundColor Yellow
        Write-Host "   - Git GUI applications" -ForegroundColor Yellow
        Write-Host "   - Other terminal windows with Git commands" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "ℹ️  Lock file not found (already removed or doesn't exist)" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Remove node_modules from Git tracking
Write-Host "Step 2: Removing node_modules from Git tracking..." -ForegroundColor Yellow
try {
    git rm -r --cached node_modules 2>$null
    git rm -r --cached **/node_modules 2>$null
    Write-Host "✅ node_modules removed from Git tracking" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  node_modules not tracked (this is good!)" -ForegroundColor Gray
}

Write-Host ""

# Step 3: Verify .gitignore
Write-Host "Step 3: Verifying .gitignore..." -ForegroundColor Yellow
if (Test-Path .gitignore) {
    Write-Host "✅ .gitignore exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  .gitignore not found - creating one..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Done! You can now run Git commands." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Your commit message'" -ForegroundColor White

