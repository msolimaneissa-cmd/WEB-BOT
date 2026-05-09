/**
 * @file src/lib/dashboard-audit.ts
 * @description سجل تدقيق لوحة التحكم — يرسل Webhook لقناة سرية في الديسكورد
 * عند كل تعديل يجريه الإدمن من لوحة التحكم.
 */

export async function logDashboardAction(
  adminName: string,
  adminId: string,
  action: string,
  details: string
): Promise<void> {
  const webhookUrl = process.env.DASHBOARD_AUDIT_WEBHOOK_URL;
  if (!webhookUrl) return; // إذا لم يكن الـ Webhook مضبوطاً، تجاهل

  const embed = {
    title: `🛡️ سجل لوحة التحكم — ${action}`,
    color: 0xe67e22, // لون برتقالي للتمييز عن باقي الـ embeds
    fields: [
      { name: '👤 الإدمن', value: `${adminName} (<@${adminId}>)`, inline: true },
      { name: '📋 الإجراء', value: action, inline: true },
      { name: '📝 التفاصيل', value: details, inline: false },
    ],
    footer: { text: 'Family Legends Dashboard Audit Log' },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (err) {
    // لا نوقف التطبيق بسبب فشل الـ Webhook
    console.warn('[AuditLog] Failed to send dashboard webhook:', err);
  }
}
