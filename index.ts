import 'dotenv/config';
import { Client, GuildTextBasedChannel, EmbedBuilder, TextChannel, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import { CronJob } from 'cron';
import moment from 'moment';

const client = new Client({intents: [GatewayIntentBits.Guilds]});

const job = new CronJob({
    cronTime: '*/1 * * * *',
    onTick: runCron,
    start: false,
    timeZone: 'Europe/Paris',
  });

client.on('ready', async () => {
    console.log('bot ready');
    job.start();
});

async function runCron() {
    const mEactivity = await axios.get(process.env.ME_URL!);
    const lastMinutes = (new Date().getTime() - Number(process.env.MILLISECONDS!)) / 1000;
    // filter recent activity
    let recentActivity = mEactivity.data.filter(act => act.blockTime > lastMinutes);
    let sales = recentActivity.filter(sale => sale.type === 'buyNow');
    let lists = recentActivity.filter(sale => sale.type === 'list');
    for (let sale of sales) {
        let channel = client.channels.cache.get(process.env.SALES_CHANNEL_ID!) as TextChannel;
        const nftDetails = await axios.get(process.env.ME_NFT_URL + sale.tokenMint);
        // console.log(nftDetails);
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`New sale! ${nftDetails.data.name} `)
            .setURL('https://discord.js.org/')
            // .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
            // .setDescription(`Purchased by ${sale.buyer} from ${sale.seller} for ${sale.price}`)
            // .setThumbnail(sale.image)
            .addFields(
                { name: 'Purchased by', value: `${sale.buyer}` },
                { name: 'from', value: `${sale.seller}` },
                { name: 'for', value: `${sale.price}` },
                // { name: '\u200B', value: '\u200B' },
                // { name: 'Inline field title', value: 'Some value here', inline: true },
                // { name: 'Inline field title', value: 'Some value here', inline: true },
            )
            // .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
            .setImage(sale.image)
            // .setTimestamp(sale.blockTime)
            .setFooter({ text: moment(sale.blockTime * 1000).format('hh:mm:ss') });

        channel.send({ embeds: [embed] });
    }

    for (let list of lists) {
        let channel = client.channels.cache.get(process.env.LIST_CHANNEL_ID!) as TextChannel;
        const nftDetails = await axios.get(process.env.ME_NFT_URL + list.tokenMint);
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`New listing for ${nftDetails.data.name} `)
            .setURL('https://discord.js.org/')
            .addFields(
                { name: 'By', value: `${list.seller}` },
                { name: 'for', value: `${list.price}` },
            )
            .setImage(list.image)
            .setFooter({ text: moment(list.blockTime * 1000).format('hh:mm:ss') });

        channel.send({ embeds: [embed] });
    }
};

(async () => {
    try {
        // connect to ME's API every 5 minutes to check activity on collection
        await client.login(process.env.TOKEN);
    } catch(err) {
        console.log(err);
    }
})();
