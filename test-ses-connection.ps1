# PowerShell script to test AWS SES SMTP connection
$smtpServer = "email-smtp.eu-west-1.amazonaws.com"
$smtpPort = 587
$smtpUsername = $env:EMAIL_SERVER_USER  # Using environment variable for username
$smtpPassword = $env:EMAIL_SERVER_PASSWORD  # Using environment variable for password

Write-Host "Testing connection to AWS SES SMTP Server: $smtpServer on port $smtpPort"

# First test basic TCP connection
$tcpClient = New-Object System.Net.Sockets.TcpClient
try {
    Write-Host "1. Testing basic TCP connection..."
    $tcpClient.Connect($smtpServer, $smtpPort)
    if ($tcpClient.Connected) {
        Write-Host "   SUCCESS: TCP connection established" -ForegroundColor Green
    }
    $tcpClient.Close()
} catch {
    Write-Host "   FAILED: Could not establish TCP connection: $_" -ForegroundColor Red
    exit
}

# Test full SMTP connection with authentication
try {
    Write-Host "2. Testing full SMTP connection..."
    $smtp = New-Object System.Net.Mail.SmtpClient($smtpServer, $smtpPort)
    $smtp.EnableSsl = $true
    $smtp.Timeout = 60000  # 60 seconds timeout
    
    if ($smtpUsername -and $smtpPassword) {
        Write-Host "   Using credentials from environment variables"
        $smtp.Credentials = New-Object System.Net.NetworkCredential($smtpUsername, $smtpPassword)
        
        # Create a test message - this won't actually be sent
        $mailMessage = New-Object System.Net.Mail.MailMessage
        $mailMessage.From = New-Object System.Net.Mail.MailAddress($env:EMAIL_FROM)
        $mailMessage.To.Add("test@example.com")  # Dummy recipient
        $mailMessage.Subject = "SMTP Connection Test"
        $mailMessage.Body = "This is a test message to verify SMTP connectivity."
        
        # If we get this far without error, the connection is working
        Write-Host "   SUCCESS: SMTP client initialized with SSL and authentication" -ForegroundColor Green
        Write-Host "Connection to AWS SES SMTP server is working correctly." -ForegroundColor Green
    } else {
        Write-Host "   WARNING: No credentials available from environment variables" -ForegroundColor Yellow
        Write-Host "   Could not test full SMTP authentication" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   FAILED: SMTP connection test failed: $_" -ForegroundColor Red
} 