# Accessing PlayCanvas Through Firewall Restrictions (05-03-2025)

## Method 1: Using Secure DNS in Chrome

1. Open Chrome Settings:
   - Click the three dots menu (⋮) in the top-right corner
   - Go to Settings
   - Click on "Privacy and security" in the left sidebar
   - Scroll down to "Security"

2. Configure Secure DNS:
   - Find "Use secure DNS" option
   - Select "With" and choose one of these providers:
     - Cloudflare (1.1.1.1)
     - Google (8.8.8.8)
     - OpenDNS (208.67.222.222)
   - Or enter a custom DNS provider

## Method 2: Using Alternative URLs

Instead of playcanvas.com, try these alternatives:
- https://playcanvas.com/editor (direct editor link)
- https://playcanvas.com/project (direct project link)
- Use IP address directly (if available)

## Method 3: Browser Extensions

1. Install a DNS over HTTPS extension:
   - "DNS over HTTPS" by Mozilla
   - "Secure DNS" by Google
   - "DNS over HTTPS" by Cloudflare

2. Configure the extension:
   - Choose a DNS provider
   - Enable the extension
   - Restart Chrome

## Method 4: Using a Different Browser

If Chrome is restricted, try:
1. Firefox (with built-in DNS over HTTPS)
2. Edge (with its own DNS settings)
3. Brave (with built-in privacy features)

## Method 5: Local DNS Override

1. Open Chrome and go to:
   ```
   chrome://net-internals/#dns
   ```
2. Add a host rule:
   - Host: playcanvas.com
   - IP: [PlayCanvas IP address]

## Method 6: Using Caddy as a Reverse Proxy

1. Install Caddy:
   ```bash
   # On macOS with Homebrew
   brew install caddy
   
   # On Windows with Chocolatey
   choco install caddy
   ```

2. Create a Caddyfile (e.g., `Caddyfile`):
   ```
   your-custom-domain.com {
       reverse_proxy playcanvas.com {
           header_up Host playcanvas.com
           header_up X-Real-IP {remote_host}
           header_up X-Forwarded-For {remote_host}
           header_up X-Forwarded-Proto {scheme}
       }
   }
   ```

3. Configure your hosts file:
   ```
   # On Windows: C:\Windows\System32\drivers\etc\hosts
   # On macOS/Linux: /etc/hosts
   127.0.0.1 your-custom-domain.com
   ```

4. Start Caddy:
   ```bash
   caddy run
   ```

5. Access PlayCanvas through your custom domain:
   - https://your-custom-domain.com

### Advanced Caddy Configuration

For better security and performance:
```
your-custom-domain.com {
    # Enable HTTPS
    tls internal

    # Add security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
    }

    # Handle all PlayCanvas subdomains
    @playcanvas {
        host playcanvas.com *.playcanvas.com
    }

    # Reverse proxy settings with URL rewriting
    reverse_proxy @playcanvas {
        # Basic headers
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        
        # WebSocket support
        header_up Connection "Upgrade"
        header_up Upgrade "websocket"

        # URL rewriting
        uri strip_prefix /
        uri replace /editor /editor
        uri replace /project /project
        uri replace /api /api
        uri replace /assets /assets
        uri replace /scripts /scripts
        uri replace /styles /styles

        # Handle redirects
        header_down Location {http.header.Location}
        header_down Set-Cookie {http.header.Set-Cookie}
        
        # Preserve original host in redirects
        header_down Location {http.header.Location} {
            regexp ^https?://playcanvas\.com(.*)
            replace https://your-custom-domain.com{1}
        }
    }

    # Handle specific paths
    handle /editor/* {
        reverse_proxy @playcanvas {
            header_up Host editor.playcanvas.com
        }
    }

    handle /project/* {
        reverse_proxy @playcanvas {
            header_up Host project.playcanvas.com
        }
    }

    handle /api/* {
        reverse_proxy @playcanvas {
            header_up Host api.playcanvas.com
        }
    }

    # Add compression
    encode gzip

    # Logging
    log {
        output file /var/log/caddy/access.log
        format json
    }
}
```

### Additional Configuration Notes

1. URL Rewriting:
   - The configuration preserves all important paths (/editor, /project, /api, etc.)
   - Handles subdomains properly
   - Maintains WebSocket connections

2. Redirect Handling:
   - Preserves original redirects from PlayCanvas
   - Rewrites redirect URLs to use your custom domain
   - Maintains cookies and session data

3. Subdomain Support:
   - Handles editor.playcanvas.com
   - Handles project.playcanvas.com
   - Handles api.playcanvas.com
   - Handles assets.playcanvas.com

4. Performance:
   - Includes gzip compression
   - Maintains WebSocket connections
   - Proper header forwarding

### Testing the Configuration

1. Test basic access:
   ```bash
   curl -I https://your-custom-domain.com
   ```

2. Test editor access:
   ```bash
   curl -I https://your-custom-domain.com/editor
   ```

3. Test WebSocket:
   ```bash
   wscat -c wss://your-custom-domain.com/editor
   ```

4. Check redirects:
   ```bash
   curl -I -L https://your-custom-domain.com/editor
   ```

## Troubleshooting Tips

1. Clear DNS Cache:
   - Open Chrome
   - Go to chrome://net-internals/#dns
   - Click "Clear host cache"

2. Check Network Settings:
   - Open Chrome
   - Go to chrome://net-internals/#network
   - Look for any blocked connections

3. Test Connection:
   - Open Chrome DevTools (F12)
   - Go to Network tab
   - Try accessing PlayCanvas
   - Look for any blocked or failed requests

## Security Considerations

- Only use trusted DNS providers
- Keep browser and extensions updated
- Use HTTPS connections only
- Be cautious with browser extensions
- Report security issues to your IT department

## Alternative Solutions

If none of the above work:
1. Contact your IT department for proper access
2. Use a VPN service (if allowed)
3. Request a local proxy server
4. Use a mobile hotspot temporarily
5. Consider using offline development tools 