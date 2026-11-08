import dotenv from "dotenv"
import nodemailer from "nodemailer"

dotenv.config()

const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{user:process.env.EMAIL_USER,pass:process.env.EMAIL_APP_PASSWORD}
})

export const sendPasswordResetEmail=(email:string,resetLink:string)=>{

    return transporter.sendMail({

        from:`SkyInfo <${process.env.EMAIL_USER}>`,
        to:email,
        subject:"SkyInfo - Reset your password",
        html:`
            <div style="
                max-width:520px;
                margin:30px auto;
                padding:32px;
                background:#071725;
                border-radius:16px;
                font-family:Arial,sans-serif;
                color:#ffffff;
            ">

                <h2>SkyInfo</h2>

                <p>
                    We received a request to reset your password.
                </p>

                <p>
                    Click the button below to create a new password.
                </p>

                <a
                    href="${resetLink}"
                    style="
                        display:inline-block;
                        margin:15px 0;
                        padding:13px 22px;
                        background:#2f98e8;
                        color:#ffffff;
                        border-radius:9px;
                        text-decoration:none;
                        font-weight:bold;
                    "
                >
                    Reset password
                </a>

                <p>
                    This link is valid for 15 minutes.
                </p>

            </div>
        `
    })
}

export const sendAccountDeletedEmail = (
    email: string,
    firstName: string,
    registerLink: string
) => {

    return transporter.sendMail({

        from: `SkyInfo <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "SkyInfo - Your account has been removed",

        html: `
            <div style="
                max-width:520px;
                margin:30px auto;
                padding:32px;
                background:#071725;
                border-radius:16px;
                font-family:Arial,sans-serif;
                color:#ffffff;
            ">

                <h2 style="
                    margin-bottom:25px;
                ">
                    SkyInfo
                </h2>

                <p>
                    Hello ${firstName},
                </p>

                <p>
                    Your SkyInfo account has been removed by an administrator.
                </p>

                <p>
                    If you would like to use SkyInfo again, you can create
                    a new account by completing the registration process.
                </p>

                <a
                    href="${registerLink}"
                    style="
                        display:inline-block;
                        margin:15px 0;
                        padding:13px 22px;
                        background:#2f98e8;
                        color:#ffffff;
                        border-radius:9px;
                        text-decoration:none;
                        font-weight:bold;
                    "
                >
                    Register again
                </a>

                <p style="
                    margin-top:25px;
                ">
                    Thank you for using SkyInfo.
                </p>

            </div>
        `
    })
}