/**
 * Telegram Notification Utility
 * 
 * Sends secure HTML-formatted messages to a designated Telegram chat.
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment variables.
 */

export async function sendTelegramMessage(text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.warn('Telegram notifications skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing.');
        return { success: false, error: 'Config missing' };
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API Error:', data);
            return { success: false, error: data.description };
        }

        return { success: true };
    } catch (error) {
        console.error('Telegram Fetch Error:', error);
        return { success: false, error: 'Network error' };
    }
}
