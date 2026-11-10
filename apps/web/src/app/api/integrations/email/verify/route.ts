import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider = "gmail", email, password, host, port, secure = true, sendTest = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email address and App Password / SMTP password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim();
    // Strip all whitespace from App Password
    const cleanPassword = String(password).replace(/\s+/g, "").trim();

    let transporter: any;

    if (provider === "gmail" || cleanEmail.endsWith("@gmail.com") || cleanEmail.endsWith("@googlemail.com")) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: cleanEmail,
          pass: cleanPassword,
        },
        connectionTimeout: 12000,
        greetingTimeout: 12000,
      });
    } else if (provider === "outlook" || cleanEmail.endsWith("@outlook.com") || cleanEmail.endsWith("@hotmail.com")) {
      transporter = nodemailer.createTransport({
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
          user: cleanEmail,
          pass: cleanPassword,
        },
        connectionTimeout: 12000,
      });
    } else {
      const smtpHost = host || "smtp.gmail.com";
      const smtpPort = port ? Number(port) : 465;
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: cleanEmail,
          pass: cleanPassword,
        },
        connectionTimeout: 12000,
      });
    }

    // Real SMTP Handshake
    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      const rawError = verifyErr?.message || "SMTP verification failed";
      let userFriendly = rawError;
      let isAuthError = false;

      if (
        rawError.includes("535") ||
        rawError.includes("BadCredentials") ||
        rawError.includes("Username and Password not accepted") ||
        verifyErr?.code === "EAUTH"
      ) {
        isAuthError = true;
        userFriendly =
          "Gmail Login Rejected (535): Invalid App Password. Google requires a 16-character App Password (not your standard Google account password). Make sure 2-Step Verification is ON, then generate an App Password at myaccount.google.com/apppasswords.";
      } else if (verifyErr?.code === "ETIMEDOUT" || verifyErr?.code === "ECONNREFUSED") {
        userFriendly = `Connection timed out connecting to the mail server. Check your firewall settings.`;
      }

      return NextResponse.json(
        {
          ok: false,
          error: userFriendly,
          rawError,
          isAuthError,
          helpUrl: "https://myaccount.google.com/apppasswords",
          code: verifyErr?.code || "VERIFY_FAILED",
        },
        { status: 401 }
      );
    }

    // Send optional test message if requested
    let testSentSuccess = false;
    if (sendTest) {
      try {
        await transporter.sendMail({
          from: `"Miracle Creative Studio" <${cleanEmail}>`,
          to: cleanEmail,
          subject: "Miracle — Test Handshake Verified ✅",
          text: `Your email connection to Miracle is active and verified!\n\nSending Address: ${cleanEmail}\nProvider: ${provider}\nStatus: Active Handshake Verified.`,
        });
        testSentSuccess = true;
      } catch (sendErr: any) {
        console.warn("Test email send failed:", sendErr?.message);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Connected successfully (Sending as: ${cleanEmail})`,
      email: cleanEmail,
      provider,
      testSent: testSentSuccess,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
