@echo off
echo Renaming remaining directories...

git mv app/Rooms app/rooms-temp
git mv app/rooms-temp app/rooms

git mv app/Unauthorized app/unauthorized-temp
git mv app/unauthorized-temp app/unauthorized

git mv app/Dashboard app/dashboard-temp
git mv app/dashboard-temp app/dashboard

echo Done! All routes renamed to lowercase.
pause
