export const sendSmsVerification = async (phoneNumber, session) => {
    const verificationCode = "123456"; // Код для разработки
    console.log(`[DEV] SMS отправлен на номер ${phoneNumber}. Код: ${verificationCode}`);
    
    // Сохраняем код в сессии
    session.registrationData.verificationCode = verificationCode;

    return { success: true }; // В реальном проекте возвращаем ответ от API
};

export const verifySmsCode = async (phoneNumber, code) => {
    // В реальном проекте проверяем код через API
    const isValid = code === "123456"; // Для разработки всегда верен код "123456"
    return isValid;
};