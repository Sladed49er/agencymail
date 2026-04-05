/**
 * Insurance-specific email templates seeded for every new tenant.
 */

export interface SystemTemplate {
  name: string;
  subject: string;
  category: string;
  body: string;
}

const wrapper = (body: string) => `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #1e293b; font-size: 20px; margin: 0;">{{agencyName}}</h1>
  </div>
  ${body}
  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px; text-align: center;">
    <p style="color: #94a3b8; font-size: 10px;">
      {{agencyName}} &middot; Sent by {{agentName}}<br/>
      <a href="{{unsubscribeUrl}}" style="color: #94a3b8;">Unsubscribe</a> | <a href="{{unsubscribeUrl}}" style="color: #94a3b8;">Manage Preferences</a>
    </p>
  </div>
</div>`;

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    name: "Renewal Reminder - 90 Days",
    subject: "Your {{policyType}} policy renews in 90 days",
    category: "RENEWAL",
    body: wrapper(`
      <div style="background: #eff6ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 8px;">Policy Renewal Coming Up</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">Your <strong>{{policyType}}</strong> policy with {{carrier}} renews on <strong>{{renewalDate}}</strong> &mdash; that's about 90 days away.</p>
        <p style="color: #475569; margin-top: 12px;">Let's start reviewing your coverage now so we can shop for the best rates and make sure you're properly protected.</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="mailto:{{agentName}}?subject=Renewal Review" style="display: inline-block; background: #2563eb; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Schedule My Review</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">Best regards,<br/><strong>{{agentName}}</strong></p>
    `),
  },
  {
    name: "Renewal Reminder - 60 Days",
    subject: "Your {{policyType}} policy renews in 60 days",
    category: "RENEWAL",
    body: wrapper(`
      <div style="background: #fef9c3; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #854d0e; font-size: 18px; margin: 0 0 8px;">Renewal in 60 Days</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">Your <strong>{{policyType}}</strong> policy with {{carrier}} renews on <strong>{{renewalDate}}</strong>. We're actively comparing rates to find you the best coverage at the best price.</p>
        <p style="color: #475569; margin-top: 12px;">If you've had any life changes &mdash; new home, new car, additional family member &mdash; let me know so we can adjust your coverage accordingly.</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="mailto:{{agentName}}?subject=Renewal Update" style="display: inline-block; background: #ca8a04; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Update My Info</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">&mdash; {{agentName}}</p>
    `),
  },
  {
    name: "Renewal Reminder - 30 Days",
    subject: "Action needed: {{policyType}} policy renews in 30 days",
    category: "RENEWAL",
    body: wrapper(`
      <div style="background: #fef3c7; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #92400e; font-size: 18px; margin: 0 0 8px;">Renewal in 30 Days</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">Your <strong>{{policyType}}</strong> policy renews on <strong>{{renewalDate}}</strong>. If we haven't connected yet about your renewal, now is the time.</p>
        <p style="color: #475569; margin-top: 12px;">I want to make sure you have the right coverage at the best price. A quick 10-minute call is all it takes.</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="mailto:{{agentName}}?subject=Urgent: Policy Renewal" style="display: inline-block; background: #d97706; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Contact Me Now</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">&mdash; {{agentName}}</p>
    `),
  },
  {
    name: "Happy Birthday",
    subject: "Happy Birthday, {{firstName}}!",
    category: "BIRTHDAY",
    body: wrapper(`
      <div style="text-align: center; padding: 24px;">
        <p style="font-size: 48px; margin: 0;">&#127874;</p>
        <h2 style="color: #1e293b; font-size: 22px; margin: 12px 0 8px;">Happy Birthday, {{firstName}}!</h2>
        <p style="color: #475569; font-size: 15px;">From all of us at {{agencyName}}, we hope you have a wonderful day!</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Birthdays are also a great time to review your coverage and make sure everything is up to date. Feel free to reach out anytime!</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 16px;">Warmly,<br/><strong>{{agentName}}</strong></p>
      </div>
    `),
  },
  {
    name: "Welcome - New Client",
    subject: "Welcome to {{agencyName}}!",
    category: "WELCOME",
    body: wrapper(`
      <div style="background: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #166534; font-size: 18px; margin: 0 0 8px;">Welcome Aboard!</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">Thank you for choosing {{agencyName}} for your insurance needs. We're thrilled to have you as a client!</p>
      </div>
      <div style="margin: 20px 0;">
        <h3 style="color: #1e293b; font-size: 15px;">What's Next?</h3>
        <ul style="color: #475569; font-size: 14px; line-height: 1.8;">
          <li>Your policy documents will be available shortly</li>
          <li>Save our contact info for any questions</li>
          <li>We'll check in periodically to make sure your coverage stays current</li>
        </ul>
      </div>
      <p style="color: #64748b; font-size: 13px;">Looking forward to a great relationship!<br/><strong>{{agentName}}</strong></p>
    `),
  },
  {
    name: "Cross-Sell - Bundle & Save",
    subject: "Save money by bundling your insurance, {{firstName}}",
    category: "CROSS_SELL",
    body: wrapper(`
      <div style="background: #faf5ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #6b21a8; font-size: 18px; margin: 0 0 8px;">Bundle & Save</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">Did you know that bundling your home and auto insurance could save you <strong>up to 25%</strong> on your premiums?</p>
        <p style="color: #475569; margin-top: 12px;">I noticed you currently have {{policyType}} coverage with us, and I'd love to explore whether we can find you additional savings by bundling your policies.</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="mailto:{{agentName}}?subject=Bundle Quote Request" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Get My Bundle Quote</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">&mdash; {{agentName}}</p>
    `),
  },
  {
    name: "Annual Policy Review",
    subject: "Time for your annual insurance review, {{firstName}}",
    category: "REVIEW",
    body: wrapper(`
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 8px;">Annual Policy Review</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">A lot can change in a year &mdash; new home improvements, a new car, life milestones. That's why we like to check in annually to make sure your coverage still fits your life.</p>
        <p style="color: #475569; margin-top: 12px;">A quick review can help ensure you're not overpaying or underinsured. Let's set up a 15-minute call at your convenience.</p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="mailto:{{agentName}}?subject=Annual Review Request" style="display: inline-block; background: #0f172a; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Book My Review</a>
      </div>
      <p style="color: #64748b; font-size: 13px;">&mdash; {{agentName}}</p>
    `),
  },
  {
    name: "Post-Claim Check-In",
    subject: "Checking in on your recent claim, {{firstName}}",
    category: "CLAIM",
    body: wrapper(`
      <div style="background: #fef2f2; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #991b1b; font-size: 18px; margin: 0 0 8px;">How Are Things Going?</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">I wanted to check in and see how things are going after your recent claim. Filing a claim is never fun, and I want to make sure the process went smoothly.</p>
        <p style="color: #475569; margin-top: 12px;">If you have any questions about your claim status, coverage, or if there's anything else I can help with, please don't hesitate to reach out.</p>
      </div>
      <p style="color: #64748b; font-size: 13px;">Here for you,<br/><strong>{{agentName}}</strong></p>
    `),
  },
  {
    name: "Referral Request",
    subject: "Know someone who needs great insurance?",
    category: "REFERRAL",
    body: wrapper(`
      <div style="background: #ecfdf5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #065f46; font-size: 18px; margin: 0 0 8px;">Share the Love</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">Thank you for being a valued client of {{agencyName}}! If you have friends, family, or colleagues who could use great insurance service, we'd love to help them too.</p>
        <p style="color: #475569; margin-top: 12px;">Simply reply to this email or give us a call with their name and number, and we'll take it from there. Your referrals mean the world to us!</p>
      </div>
      <p style="color: #64748b; font-size: 13px;">Thank you!<br/><strong>{{agentName}}</strong></p>
    `),
  },
  {
    name: "Holiday Greeting - New Year",
    subject: "Happy New Year from {{agencyName}}!",
    category: "HOLIDAY",
    body: wrapper(`
      <div style="text-align: center; padding: 24px;">
        <p style="font-size: 48px; margin: 0;">&#127878;</p>
        <h2 style="color: #1e293b; font-size: 22px; margin: 12px 0 8px;">Happy New Year!</h2>
        <p style="color: #475569; font-size: 15px;">From everyone at {{agencyName}}, we wish you and your family a healthy, happy, and prosperous New Year!</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">A new year is a great time to review your insurance coverage. If anything has changed in your life, let's make sure your policies reflect it.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 16px;">Cheers,<br/><strong>{{agentName}}</strong></p>
      </div>
    `),
  },
  {
    name: "Holiday Greeting - Thanksgiving",
    subject: "Happy Thanksgiving from {{agencyName}}",
    category: "HOLIDAY",
    body: wrapper(`
      <div style="text-align: center; padding: 24px;">
        <p style="font-size: 48px; margin: 0;">&#127807;</p>
        <h2 style="color: #1e293b; font-size: 22px; margin: 12px 0 8px;">Happy Thanksgiving!</h2>
        <p style="color: #475569; font-size: 15px;">We're grateful for clients like you, {{firstName}}. Thank you for trusting {{agencyName}} with your insurance needs.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">Wishing you a wonderful Thanksgiving filled with family and gratitude.</p>
        <p style="color: #64748b; font-size: 13px; margin-top: 16px;">Warm regards,<br/><strong>{{agentName}}</strong></p>
      </div>
    `),
  },
  {
    name: "Policy Change Confirmation",
    subject: "Your policy has been updated",
    category: "GENERAL",
    body: wrapper(`
      <div style="background: #f0f9ff; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #0369a1; font-size: 18px; margin: 0 0 8px;">Policy Update Confirmed</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">This is to confirm that your <strong>{{policyType}}</strong> policy has been updated as requested. Your updated documents should arrive shortly.</p>
        <p style="color: #475569; margin-top: 12px;">If you have any questions about the changes or need anything else, don't hesitate to reach out.</p>
      </div>
      <p style="color: #64748b; font-size: 13px;">&mdash; {{agentName}}<br/>{{agencyName}}</p>
    `),
  },
  {
    name: "Thank You / Appreciation",
    subject: "Thank you, {{firstName}}!",
    category: "GENERAL",
    body: wrapper(`
      <div style="background: #fefce8; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="color: #854d0e; font-size: 18px; margin: 0 0 8px;">A Quick Thank You</h2>
        <p style="color: #1e293b; margin: 0;">Hi {{firstName}},</p>
        <p style="color: #475569; margin-top: 12px;">I just wanted to take a moment to say <strong>thank you</strong> for being a loyal client of {{agencyName}}. Your trust means a great deal to us.</p>
        <p style="color: #475569; margin-top: 12px;">We're always here when you need us. Whether it's a question about your coverage, a claim, or just to chat &mdash; don't hesitate to reach out.</p>
      </div>
      <p style="color: #64748b; font-size: 13px;">With appreciation,<br/><strong>{{agentName}}</strong></p>
    `),
  },
];
