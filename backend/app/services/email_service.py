"""Transactional email service.

Sends system-level emails (welcome, password reset, contact-form forwards).
Falls back to logging in dev mode when SMTP is not configured.
"""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


# ── Core send ───────────────────────────────────────────────────


async def send_email(
    *,
    to: str | list[str],
    subject: str,
    body_html: str,
    body_text: str | None = None,
    reply_to: str | None = None,
) -> bool:
    """Send a transactional email. Returns True on success.

    Falls back to console logging when SMTP is not configured. Runs SMTP in a
    thread to avoid blocking the event loop.
    """
    recipients = [to] if isinstance(to, str) else to
    if not recipients:
        logger.warning("send_email: no recipients")
        return False

    if not settings.smtp_host:
        _log_email(to=recipients, subject=subject, body=body_text or body_html)
        return True

    try:
        await asyncio.to_thread(
            _send_smtp,
            to=recipients,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            reply_to=reply_to,
        )
        logger.info("email_sent", extra={"to": recipients, "subject": subject})
        return True
    except Exception as e:
        logger.error("email_send_failed", extra={"to": recipients, "error": str(e)})
        return False


def _send_smtp(
    *,
    to: list[str],
    subject: str,
    body_html: str,
    body_text: str | None,
    reply_to: str | None,
) -> None:
    """Synchronous SMTP send (called via ``asyncio.to_thread``)."""
    msg = MIMEMultipart("alternative")
    sender = settings.smtp_from or settings.smtp_user or f"mok@{settings.smtp_host}"
    msg["From"] = sender
    msg["To"] = ", ".join(to)
    msg["Subject"] = subject
    if reply_to:
        msg["Reply-To"] = reply_to

    if body_text:
        msg.attach(MIMEText(body_text, "plain"))
    msg.attach(MIMEText(body_html, "html"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
        server.starttls()
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg, to_addrs=to)


def _log_email(*, to: list[str], subject: str, body: str) -> None:
    """Log the email when SMTP isn't configured (dev mode)."""
    border = "=" * 60
    logger.info(
        "transactional_email (dev mode — no SMTP)",
        extra={"to": to, "subject": subject},
    )
    print(f"\n{border}")
    print("TRANSACTIONAL EMAIL (dev mode — no SMTP configured)")
    print(border)
    print(f"To:      {', '.join(to)}")
    print(f"Subject: {subject}")
    print(border)
    print(body[:1000] if body else "(no body)")
    print(f"{border}\n")


# ── Templates ───────────────────────────────────────────────────

_BASE_STYLE = """
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 560px; margin: 0 auto; padding: 32px 24px;
            color: #1e293b; line-height: 1.6;">
"""
_FOOTER = """
<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0;
            font-size: 12px; color: #94a3b8;">
  Sent by mok
</div>
</div>
"""


def _wrap(content: str) -> str:
    return f"{_BASE_STYLE}{content}{_FOOTER}"


def _frontend_base() -> str:
    return settings.frontend_url or "http://localhost:3000"


async def send_welcome_email(*, to: str, name: str) -> bool:
    """Send a welcome email to a newly registered user."""
    base_url = _frontend_base()
    subject = f"Welcome to {settings.app_name}"
    html = _wrap(f"""
        <h2 style="margin: 0 0 8px; font-size: 20px;">Welcome, {name}!</h2>
        <p>Your account is ready. You can sign in any time:</p>
        <p>
          <a href="{base_url}/login"
             style="display: inline-block; padding: 10px 24px; background: #3b82f6;
                    color: white; text-decoration: none; border-radius: 6px;
                    font-weight: 600;">Sign in</a>
        </p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
          If you didn't expect this email, you can safely ignore it.
        </p>
    """)
    text = f"Welcome, {name}! Sign in at {base_url}/login"
    return await send_email(to=to, subject=subject, body_html=html, body_text=text)


async def send_password_reset_email(*, to: str, name: str, reset_token: str) -> bool:
    """Send a password reset link valid for one hour."""
    base_url = _frontend_base()
    reset_url = f"{base_url}/reset-password?token={reset_token}"

    subject = f"Reset your {settings.app_name} password"
    html = _wrap(f"""
        <h2 style="margin: 0 0 8px; font-size: 20px;">Password reset</h2>
        <p>Hi {name},</p>
        <p>We received a request to reset your password. Click below to set a new one:</p>
        <p>
          <a href="{reset_url}"
             style="display: inline-block; padding: 10px 24px; background: #3b82f6;
                    color: white; text-decoration: none; border-radius: 6px;
                    font-weight: 600;">Reset password</a>
        </p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
          This link expires in 1 hour. If you didn't request a reset, ignore this email.
        </p>
    """)
    text = f"Hi {name}, reset your password at: {reset_url} (expires in 1 hour)"
    return await send_email(to=to, subject=subject, body_html=html, body_text=text)


async def send_password_changed_email(*, to: str, name: str) -> bool:
    """Confirm that a password was just changed."""
    subject = f"Your {settings.app_name} password was changed"
    html = _wrap(f"""
        <h2 style="margin: 0 0 8px; font-size: 20px;">Password changed</h2>
        <p>Hi {name},</p>
        <p>Your password was successfully changed. If this wasn't you, contact
        an administrator immediately.</p>
    """)
    text = f"Hi {name}, your {settings.app_name} password was changed."
    return await send_email(to=to, subject=subject, body_html=html, body_text=text)


async def send_employer_invite(
    *,
    to: str,
    contact_name: str,
    organisation_name: str,
    invite_token: str,
) -> bool:
    """Send the HR contact a link to accept their employer invitation."""
    base_url = _frontend_base()
    accept_url = f"{base_url}/employer/accept-invite?token={invite_token}"
    subject = f"Welcome to {settings.app_name} — set up {organisation_name}"
    html = _wrap(f"""
        <h2 style="margin: 0 0 8px; font-size: 20px;">Welcome aboard.</h2>
        <p>Hi {contact_name},</p>
        <p>Our team has set up {organisation_name} on {settings.app_name}. To
        accept your invitation and choose a password for your employer portal,
        click below:</p>
        <p>
          <a href="{accept_url}"
             style="display: inline-block; padding: 12px 26px; background: #2F4A75;
                    color: white; text-decoration: none; border-radius: 6px;
                    font-weight: 600;">Accept invitation</a>
        </p>
        <p style="color: #475569; margin-top: 18px;">
          After you set your password, you'll walk through a short orientation
          tailored to HR and land in your dashboard, where you can invite
          practitioners, write a welcome note for them, and turn the cohort
          feature on whenever your team is ready.
        </p>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 22px;">
          This invitation link expires in 14 days. If you weren't expecting
          this, you can safely ignore the email.
        </p>
    """)
    text = (
        f"Hi {contact_name}, please accept your YouSourceful invitation at: "
        f"{accept_url} (expires in 14 days)"
    )
    return await send_email(to=to, subject=subject, body_html=html, body_text=text)


async def send_contact_message(
    *,
    to: str,
    sender_name: str,
    sender_email: str,
    subject: str,
    message: str,
) -> bool:
    """Forward a contact-form submission to the operator inbox."""
    forwarded_subject = f"[mok contact] {subject}"
    safe_message = message.replace("<", "&lt;").replace(">", "&gt;")
    html = _wrap(f"""
        <h2 style="margin: 0 0 8px; font-size: 20px;">New contact submission</h2>
        <p><strong>From:</strong> {sender_name} &lt;{sender_email}&gt;</p>
        <p><strong>Subject:</strong> {subject}</p>
        <pre style="white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0;
                    border-radius: 6px; padding: 12px;">{safe_message}</pre>
    """)
    text = f"From: {sender_name} <{sender_email}>\nSubject: {subject}\n\n{message}"
    return await send_email(
        to=to,
        subject=forwarded_subject,
        body_html=html,
        body_text=text,
        reply_to=sender_email,
    )
