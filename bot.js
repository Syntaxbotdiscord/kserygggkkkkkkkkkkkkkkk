//Reflex Music Bot
//Alex Mao

const Discord = require('discord.js');
const yt = require('ytdl-core');
const client = new Discord.Client();

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
    console.log('lets drop a beat!');
});

client.on('message', msg => {
	if (!msg.content.startsWith(tokens.prefix)) return;
	if (commands.hasOwnProperty(msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0])) commands[msg.content.toLowerCase().slice(tokens.prefix.length).split(' ')[0]](msg);
});

let queue = {};

const commands = {
    'play': (msg) => {
        if(queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`you need some songs in the queue homeboy. add them with ${tokens.prefix}add`);
        if(!msg.guild.voiceConnection) return commands.join(msg).then(() => commands.play(msg));
        if(queue[msg.guild.id].playing) return msg.channel.sendMessage('already bumpin tunes my dude');
        let dispatcher;
        queue[msg.guild.id].playing = true;


        console.log(queue);
        (function play(song) {
            console.log(song);
            if(song === undefined) return msg.channel.sendMessage('nothing to bump homie').then(() => {
                queue[msg.guild.id].playing=false;
                msg.member.voiceChannel.leave();
            });
            msg.channel.sendMessage(`playing: **${song.title}** as requested by: **${song.requester}**`);
            dispatcher = msg.guild.voiceConnection.playStream(yt(song.url, { audioonly: true}), {passes : tokens.json});
            let collector = msg.channel.createCollector(m => m);
            collector.on('message', m =>{
                if(m.content.startsWith(tokens.prefix + 'pause')) {
                    msg.channel.sendMessage('paused').then(() => {dispatcher.passes();});
                }else if (m.content.startsWith(tokens.prefix + 'resume')){
                    msg.channel.sendMessage('resumed').then(() => {dispatcher.resume();});
                }else if (m.content.startsWith(tokens.prefix + 'skrt')){
                    msg.channel.sendMessage('skipped').then(() => {dispatcher.end();});
                }else if (m.content.startsWith('higher')){
                    if (Math.round(dispatcher.volume*50) >= 100) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
                    dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.conten.split('-').length-1)))/50, 0));
                    msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
                }else if (m.content.startsWith('lower')){
                    if (Math.round(dispatcher.volume*50) <= 0) return msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
                    dispatcher.setVolume(Math.max((dispatcher.volume*50 - (2*(m.content.split('-').length-1)))/50, 0));
                    msg.channel.sendMessage(`Volume: ${Math.round(dispatcher.volume*50)}%`);
                }else if (m.content.startsWith(tokens.prefix + 'time')){
                    msg.channel.sendMessage(`time: ${Math.floor(dispatcher.time / 60000)}:${Math.floor((dispatcher.time % 60000)/1000) <10 ? '0' +Math.floor((dispatcher.time % 60000)/1000) : Math.floor((dispatcher.time % 60000)/1000)}`);
                }
            });
            dispatcher.on('end', () => {
                collector.stop();
                queue[msg.guild.id].songs.shift();
            play(queue[msg.guild.id].songs[0]);
            });
            dispatcher.on('error', (err) => {
                return msg.channel.sendMessage('error: ' + err).then(() => {
                    collector.stop();
                    queue[msg.guild.id].songs.shift();
                    play(queue[msg.guild.id].songs[0]);
                });
            });
        })(queue[msg.guild.id].songs[0]);

        },
        'join' : (msg) => {
            return new Promise((resolve, reject) => {
                const voiceChannel = msg.member.voiceChannel;
                if(!voiceChannel || voiceChannel.type !== 'voice') return msg.reply('i could\'t bump with you');
                voiceChannel.join().then(connection => resolve(conection)).catch(err => reject(err));
            });
        },
        'add' : (msg) => {
            let url = msg.content.split(' ')[1];
            if (url == '' || url === undefined) return msg.channel.sendMessage(`homie, you need a url or a youtube video id after ${tokens.prefix}add`);
            yt.getInfo(url, (err, info) =>{
                if(err) return msg.channel.sendMessage('nigga this invalid: ' +err);
                if(!queue.hasOwnProperty(msg.guild.id)) queue[msg.guild.id] = {}, queue[msg.guild.id].playing = false, queue[msg.guild.id].songs = [];
                queue[msg.guild.id].songs.push({url: url, title: info.title, requester: msg.author.username});
                msg.channel.sendMessage(`added **${info.title}** to the queue`);

    });

 },
        'queue' : (msg) => {
             if (queue[msg.guild.id] === undefined) return msg.channel.sendMessage(`Add some songs to the queue first with ${tokens.prefix}add`);
		    let tosend = [];
		    queue[msg.guild.id].songs.forEach((song, i) => { tosend.push(`${i+1}. ${song.title} - Requested by: ${song.requester}`);});
		    msg.channel.sendMessage(`__**${msg.guild.name}'s Music Queue:**__ Currently **${tosend.length}** songs queued ${(tosend.length > 15 ? '*[Only next 15 shown]*' : '')}\n\`\`\`${tosend.slice(0,15).join('\n')}\`\`\``);
	},
 };
