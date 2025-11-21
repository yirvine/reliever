"use server"

import nodemailer from "nodemailer"

export async function sendContactEmail(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const message = formData.get("message") as string

    // Validation
    if (!name || !email || !message) {
      return { error: "All fields are required" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Please enter a valid email address" }
    }

    const contactEmail = process.env.CONTACT_EMAIL
    if (!contactEmail) {
      console.error("CONTACT_EMAIL environment variable is not set")
      return { error: "Server configuration error. Please try again later." }
    }

    // Create a transporter (using Gmail as an example, but this can be configured)
    // For development/testing, you might want to use something like Ethereal Email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    // Email content
    const mailOptions = {
      from: process.env.SMTP_USER || contactEmail,
      to: contactEmail,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #334155; border-bottom: 2px solid #334155; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          </div>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Message:</strong></p>
            <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    return { success: "Thank you for reaching out! We'll get back to you soon." }
  } catch (error: unknown) {
    console.error("Error sending email:", error)
    
    // More user-friendly error messages
    if (error instanceof Error && error.message?.includes("Missing credentials")) {
      return { error: "Email service not configured. Please try again later." }
    }
    
    return { error: "Failed to send message. Please try again later." }
  }
}

