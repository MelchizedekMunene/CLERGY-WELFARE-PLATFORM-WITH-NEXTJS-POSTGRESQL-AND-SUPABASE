// Test SMTP connection
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  }
});

console.log('SMTP Configuration:');
console.log('Host:', envVars.SMTP_HOST);
console.log('Port:', envVars.SMTP_PORT);
console.log('User:', envVars.SMTP_USER);
console.log('Password:', envVars.SMTP_PASSWORD ? '***' : 'NOT SET');
console.log('');

const transporter = nodemailer.createTransport({
  host: envVars.SMTP_HOST,
  port: parseInt(envVars.SMTP_PORT),
  secure: envVars.SMTP_SECURE === 'true',
  auth: {
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASSWORD,
  },
});

console.log('Testing SMTP connection...\n');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:');
    console.error(error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nPossible causes:');
      console.error('- Gmail is blocking the connection');
      console.error('- Firewall is blocking port 587');
      console.error('- Invalid app password');
    }
    process.exit(1);
  } else {
    console.log('✓ SMTP Connection Successful!');
    console.log('Ready to send emails');
    process.exit(0);
  }
});
