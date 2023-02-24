import config from 'config'
import nodemailer from 'nodemailer'
import { MailOptions } from 'nodemailer/lib/sendmail-transport'
import { UserDocument } from '../models/user.model'
import pug from 'pug'
import htmlToText from 'html-to-text'
import path from 'path'

class Email {
  public firstName: string
  public to: string
  public from: string
  constructor(public user: UserDocument, public url: string) {
    this.firstName = user.name.split(' ')[0]
    this.to = user.email
    this.from = 'Luna Lovelace'
  }

  newTransport() {
    if (config.get<string>('NODE_ENV') === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: config.get<string>('SENDGRID_USERNAME'),
          pass: config.get<string>('SENDGRID_PASSWORD'),
        },
      })
    }

    return nodemailer.createTransport({
      host: config.get<string>('EMAIL_HOST'),
      port: config.get<number>('EMAIL_PORT'),
      auth: {
        user: config.get<string>('EMAIL_USERNAME'),
        pass: config.get<string>('EMAIL_PASSWORD'),
      },
    })
  }

  async send(template: string, subject: string) {
    const html = pug.renderFile(
      path.join(__dirname, '..', `views/email/${template}.pug`),
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      }
    )

    const mailOptions: MailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    }

    await this.newTransport().sendMail(mailOptions)
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family')
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    )
  }
}

export default Email
