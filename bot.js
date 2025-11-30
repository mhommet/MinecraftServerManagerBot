require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.DISCORD_TOKEN;
const SERVERS_PATH = '/services/minecraftServers';
const SERVERS = [
    { name: 'minecraftrpg', display: 'RPG' },
    { name: 'minecraftskyblock', display: 'Skyblock' },
    { name: 'minecrafttwd', display: 'TWD' },
    { name: 'minecraftvanilla', display: 'Vanilla' }
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
                subcommand.setName('list').setDescription('Liste des serveurs')
            )
            .addSubcommand(subcommand =>
                subcommand.setName('status').setDescription('Statut d\'un serveur')
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
                subcommand.setName('auto').setDescription('Lance la vérification auto-arrêt')
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
            const embed = new EmbedBuilder()
                .setTitle('📋 Serveurs Minecraft')
                .setDescription(SERVERS.map(srv => `**${srv.display}** (${srv.name})`).join('\n'));
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'status' && server) {
            const { stdout } = await execAsync(`cd ${SERVERS_PATH}/${server} && docker-compose ps`);
            const running = stdout.includes('Up');
            const embed = new EmbedBuilder()
                .setTitle(`📊 Statut ${server}`)
                .addFields(
                    { name: 'État', value: running ? '🟢 En marche' : '🔴 Arrêté', inline: true },
                    { name: 'Vérification', value: '`docker-compose ps`', inline: true }
                );
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'auto') {
            await execAsync('/usr/local/bin/minecraft-autostop.sh');
            await interaction.editReply('🟢 Vérification auto-arrêt lancée ! Consulte les logs dans `/var/log/minecraft-autostop.log`');
        }
    } catch (error) {
        await interaction.editReply(`❌ Erreur: ${error.message}`);
    }
});

client.login(TOKEN);

