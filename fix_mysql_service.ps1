sc.exe stop MYSQL80 2>$null
sc.exe delete MYSQL80
& "C:\mysql\mysql8.0.44\bin\mysqld.exe" --install MYSQL80 --defaults-file="C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
Start-Sleep 2
sc.exe start MYSQL80
Start-Sleep 8
sc.exe query MYSQL80
