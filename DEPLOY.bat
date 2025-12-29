@echo off
echo ================================
echo  Deploying to GitHub and Vercel
echo ================================
echo.

cd /d "%~dp0"

echo [1/4] Adding all files to git...
git add .

echo.
echo [2/4] Creating commit...
git commit -m "Fix Vercel deployment - update vercel.json and add .gitignore"

echo.
echo [3/4] Pushing to GitHub...
git push

echo.
echo [4/4] Done!
echo.
echo Your changes are now live on GitHub.
echo Vercel will automatically redeploy in 30-60 seconds.
echo.
pause
