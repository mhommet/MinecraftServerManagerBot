require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.DISCORD_TOKEN;
const SERVERS_PATH = '/services/minecraftServers';
const SERVERS = [
    { name: 'minecraftvanilla', display: 'Vanilla', port: 25565 },
    { name: 'minecrafttwd', display: 'TWD', port: 25567 },
    { name: 'minecraftskyblock', display: 'Skyblock', port: 25569 }
];

client.once('clientReady', async () => {
    console.log(`✅ Bot connecté: ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('mc')
            .setDescription('Gérer les serveurs Minecraft')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('start')
                    .setDescription('Démarrer un serveur')
                    .addStringOption(option =>
                        option.setName('serveur')
                            .setDescription('Choisir un serveur')
                            .setRequired(true)
                            .addChoices(
                                ...SERVERS.map(srv => ({ name: srv.display, value: srv.name }))
                            )
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('stop')
                    .setDescription('Arrêter un serveur')
                    .addStringOption(option =>
                        option.setName('serveur')
                            .setDescription('Choisir un serveur')
                            .setRequired(true)
                            .addChoices(
                                ...SERVERS.map(srv => ({ name: srv.display, value: srv.name }))
                            )
                    )
            )
            .addSubcommand(subcommand =>
                subcommand.setName('list').setDescription('Liste des serveurs avec statut')
            )
    ].map(command => command.toJSON());

    try {
        await client.application.commands.set(commands);
        console.log('✅ Slash commands enregistrées !');
    } catch (error) {
        console.error('❌ Erreur enregistrement:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options } = interaction;
    if (commandName !== 'mc') return;

    const subcommand = options.getSubcommand();
    const server = options.getString('serveur');

    await interaction.deferReply();

    try {
        if (subcommand === 'start' && server) {
            await execAsync(`cd ${SERVERS_PATH}/${server} && docker-compose up -d`);
            await interaction.editReply(`🟢 **${server}** démarré !`);
        } else if (subcommand === 'stop' && server) {
            await execAsync(`cd ${SERVERS_PATH}/${server} && docker-compose down`);
            await interaction.editReply(`🔴 **${server}** arrêté !`);
        } else if (subcommand === 'list') {
            let description = '';
            for (const srv of SERVERS) {
                try {
                    const { stdout } = await execAsync(`cd ${SERVERS_PATH}/${srv.name} && docker-compose ps`);
                    const running = stdout.includes('Up');
                    description += `**${srv.display}** (${srv.name}) **:${srv.port}** ${running ? '🟢 En ligne' : '🔴 Arrêté'}\n`;
                } catch {
                    description += `**${srv.display}** (${srv.name}) **:${srv.port}** ❓ Inconnu\n`;
                }
            }
            
            const embed = new EmbedBuilder()
                .setTitle('📋 Serveurs Minecraft')
                .setDescription(description);
            await interaction.editReply({ embeds: [embed] });
        }
    } catch (error) {
        await interaction.editReply(`❌ Erreur: ${error.message}`);
    }
});

client.login(TOKEN);

