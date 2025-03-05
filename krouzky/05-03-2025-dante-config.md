# Dante SOCKS5 Server Configuration (05-03-2025)

## Installation

```bash
# Update system
apt update && apt upgrade -y

# Install Dante server
apt install dante-server -y
```

## Configuration

1. Create a backup of the original config:
```bash
cp /etc/danted.conf /etc/danted.conf.backup
```

2. Edit the configuration file:
```bash
nano /etc/danted.conf
```

3. Replace the content with:
```
# Logging
logoutput: syslog

# Server settings
internal: 0.0.0.0 port = 23333
external: eth0

# Access control
socksmethod: none
clientmethod: none

# Allow all connections
client pass {
    from: 0.0.0.0/0 to: 0.0.0.0/0
    log: error connect disconnect
}

socks pass {
    from: 0.0.0.0/0 to: 0.0.0.0/0
    log: error connect disconnect
}
```

4. Create systemd service file:
```bash
nano /etc/systemd/system/danted.service
```

5. Add the following content:
```ini
[Unit]
Description=SOCKS v5 proxy server
Documentation=man:danted(8)
After=network.target

[Service]
Type=simple
ExecStart=/usr/sbin/danted -f /etc/danted.conf
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

6. Enable and start the service:
```bash
systemctl daemon-reload
systemctl enable danted
systemctl start danted
```

7. Check the status:
```bash
systemctl status danted
```

## Firewall Configuration

If using UFW:
```bash
# Allow the SOCKS5 port
ufw allow 23333/tcp

# Enable firewall if not already enabled
ufw enable
```

If using iptables:
```bash
# Allow the SOCKS5 port
iptables -A INPUT -p tcp --dport 23333 -j ACCEPT

# Save iptables rules
iptables-save > /etc/iptables.rules
```

## Testing the Configuration

1. Test locally:
```bash
# Install netcat
apt install netcat-openbsd -y

# Test connection
nc -zv localhost 23333
```

2. Test with curl:
```bash
# Install curl if not present
apt install curl -y

# Test SOCKS5 proxy
curl -x socks5://localhost:23333 http://example.com
```

## Client Configuration Examples

### Chrome/Chromium
1. Install "SwitchyOmega" or "Proxy SwitchySharp" extension
2. Create new profile with:
   - Proxy Protocol: SOCKS5
   - Proxy Server: your-server-ip
   - Proxy Port: 23333

### Firefox
1. Go to Settings > Network Settings
2. Configure Manual Proxy:
   - SOCKS Host: your-server-ip
   - Port: 23333
   - SOCKS v5

### Command Line
```bash
# Using curl
curl -x socks5://your-server-ip:23333 http://example.com

# Using wget
wget -e "https_proxy=socks5://your-server-ip:23333" https://example.com
```

## Security Considerations

1. Basic security measures:
   - Keep system updated
   - Monitor logs for suspicious activity
   - Consider implementing user authentication
   - Use firewall rules to restrict access

2. Optional authentication setup:
```bash
# Install apache2-utils for htpasswd
apt install apache2-utils -y

# Create password file
htpasswd -c /etc/danted/passwd username
```

3. Then modify danted.conf to use authentication:
```
socksmethod: username
clientmethod: username
user.privileged: root
user.notprivileged: nobody
```

## Monitoring

1. View logs:
```bash
# Real-time logs
tail -f /var/log/syslog | grep danted

# Check service status
systemctl status danted
```

2. Monitor connections:
```bash
# Install netstat if not present
apt install net-tools -y

# View active connections
netstat -tulpn | grep 23333
```

## Troubleshooting

1. Check if port is listening:
```bash
ss -tulpn | grep 23333
```

2. Check firewall rules:
```bash
# UFW
ufw status

# iptables
iptables -L | grep 23333
```

3. Test connectivity:
```bash
# From another machine
nc -zv your-server-ip 23333
```

4. Check service logs:
```bash
journalctl -u danted -f
``` 