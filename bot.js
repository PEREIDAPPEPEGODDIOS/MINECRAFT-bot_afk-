const mineflayer = require('mineflayer');

// 1. ESCUDO GLOBAL: Evita que el programa se cierre si el chat o un paquete da error
process.on('uncaughtException', (err) => {
    console.log(`[NPC] Error interno ignorado para mantener al bot conectado: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
    console.log(`[NPC] Promesa rechazada ignorada: ${reason}`);
});

let afkInterval = null;

function createBot() {
    if (afkInterval) clearInterval(afkInterval);

    const bot = mineflayer.createBot({
        host: 'logcraft.mcsh.io',
        port: 25565,           // Cambia si tienes otro puerto en tu hosting
        username: 'BotLog', 
        version: '1.21.4',     // Versión fija de tu servidor
        hideErrors: true       // Oculta errores no críticos de lectura de paquetes
    });

    bot.on('login', () => {
        console.log('[NPC] Conexión establecida con LogCraft (1.21.4).');
    });

    bot.on('spawn', () => {
        console.log('[NPC] El bot ha aparecido correctamente en LogCraft.');
        
        // Ejecuta el login automático
        setTimeout(() => {
            bot.chat('/login cubo16');
        }, 3000);
    });

    // Ignora o procesa de forma segura los mensajes del chat
    bot.on('chat', (username, message) => {
        // El bot no hace nada con el chat para evitar procesar código pesado
    });

    // Muestra la razón si el servidor decide expulsar explícitamente al bot
    bot.on('kicked', (reason) => {
        let mensaje = reason;
        try {
            mensaje = JSON.stringify(reason);
        } catch (e) {}
        console.log(`[NPC] El servidor expulsó al bot por: ${mensaje}`);
    });

    // Rutina anti-AFK (Salto y contenedor)
    afkInterval = setInterval(async () => {
        if (!bot || !bot.entity) return;

        try {
            const chestBlock = bot.findBlock({
                matching: bot.registry.blocksByName.chest ? bot.registry.blocksByName.chest.id : 54,
                maxDistance: 5
            });

            if (chestBlock) {
                console.log('[NPC] Interactuando con el contenedor...');
                const chest = await bot.openChest(chestBlock);
                await new Promise(resolve => setTimeout(resolve, 2000));
                chest.close();
                console.log('[NPC] Contenedor cerrado.');
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 500);
            console.log('[NPC] Acción anti-inactividad ejecutada.');

        } catch (err) {
            console.log(`[NPC] Aviso en rutina anti-AFK: ${err.message}`);
        }
    }, 45000);

    bot.on('end', (reason) => {
        if (afkInterval) clearInterval(afkInterval);
        console.log(`[NPC] Conexión finalizada (${reason}). Reintentando en 15 segundos...`);
        setTimeout(createBot, 15000);
    });

    bot.on('error', (err) => console.log(`[NPC] Error de red: ${err.message}`));
}

createBot();
