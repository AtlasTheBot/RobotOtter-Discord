module.exports.config = {
  name: 'revoke',
  invokers: ['revoke invites', 'ri', 'revoke'],
  help: 'Revokes invites from users',
  expandedHelp: 'Revokes invites using the passed user ID',
  usage: ['revoke 123456789', 'Revokes the invites made by user X'],
}

// TODO: Still in WIP so that it's guild-agnostic

const Discord = require('discord.js')

module.exports.events = {}
module.exports.events.message = async (bot, message) => {
  if (!message.guild) return

  if (!message.guild.me.permissions.has('MANAGE_GUILD'))
    return message.channel.send("I don't have `MANAGE_GUILD` perms.")
  if (!message.member.permissions.has('BAN_MEMBERS'))
    return message.channel.send(
      'You need to be able to ban members to revoke their invites',
    )

  let args = bot.sleet.shlex(message)

  if (args[1] === undefined)
    return message.channel.send('You need to pass a user id')

  let invites = await message.guild.fetchInvites()
  let invitesToRevoke = invites.filter(i => i.inviter.id === args[1])

  if (invitesToRevoke.size === 0)
    return message.channel.send('No (cached) invites to revoke')

  let inviteStr = ''
  const inviter = invitesToRevoke.first().inviter
  const embed = new Discord.MessageEmbed()
    .setAuthor(
      `${inviter.username}#${inviter.discriminator}`,
      inviter.avatarURL(),
    )
    .setColor('#f44336')
    .setTitle('Revoked Invites:')

  for (let [code, i] of invitesToRevoke) {
    inviteStr +=
      `[${code}]` +
      `[#${i.channel.name}] ` +
      `Uses: <${i.uses}/${i.maxUses === 0 ? '\u{221E}' : i.maxUses}>, ` +
      `Expires: ${
        i.expiresTimestamp - new Date().getTime() > 0
          ? shittyMStoTime(
              i.expiresTimestamp - new Date().getTime(),
              '{hh}:{mm}:{ss}',
            )
          : 'Never'
      }\n`
    await i.delete()
  }

  embed.setDescription('```md\n' + inviteStr + '\n```')

  message.channel.send({ embed })
}

// TODO: guild-agnostic + ez config
/*
module.exports.events.guildBanAdd = async (bot, guild, user) => {
  if (botChannels[guild.id] === undefined) return
  if (!guild.me.permissions.has('MANAGE_GUILD')) return

  let invites = await guild.fetchInvites()
  let foundInvites = invites.filter(inv => inv.inviter.id === user.id )

  if (foundInvites.size === 0) return

  let formattedInvites = ''
  for (let [code, i] of foundInvites) {
    formattedInvites +=
      `[${code}]` +
      `[#${i.channel.name}] ` +
      `Uses: <${i.uses}/${((i.maxUses === 0)? '\u{221E}' : i.maxUses)}>, ` +
      `Expires: ${(i.expiresTimestamp - new Date().getTime() > 0) ? shittyMStoTime(i.expiresTimestamp - new Date().getTime(), '{hh}:{mm}:{ss}') : 'Never'}\n`
  }

  const embed = new Discord.MessageEmbed()
    .setAuthor(`${user.username}#${user.discriminator} (${user.id})`, user.avatarURL())
    .setTitle('Displaying invites created by recently banned user:')
    .setDescription('```md\n' + formattedInvites + '```')
    .setFooter('Use "b!banrevoke [id]" or "b!br [id]" to revoke all invites.' + (guild.id === '120330239996854274') ? 'Ksink has already revoked the invites': '')


  guild.channels.get(botChannels[guild.id].logChannel).send({embed})
}
*/

function shittyMStoTime(time, text) {
  let rep = new Map()
  rep
    .set('w', time / 604800000)
    .set('week', rep.get('w') === 1 ? 'week' : 'weeks')
    .set('d', (time %= 604800000) ? time / 86400000 : 0)
    .set('day', rep.get('d') === 1 ? 'day' : 'days')
    .set('h', (time %= 86400000) ? time / 3600000 : 0)
    .set(
      'hh',
      Math.floor(rep.get('h')) < 10
        ? `0${Math.floor(rep.get('h'))}`
        : `${Math.floor(rep.get('h'))}`,
    )
    .set('hour', rep.get('h') === 1 ? 'hour' : 'hours')
    .set('m', (time %= 3600000) ? time / 60000 : 0)
    .set(
      'mm',
      Math.floor(rep.get('m')) < 10
        ? `0${Math.floor(rep.get('m'))}`
        : `${Math.floor(rep.get('m'))}`,
    )
    .set('minute', rep.get('m') === 1 ? 'minute' : 'minutes')
    .set('s', (time %= 60000) ? time / 1000 : 0)
    .set(
      'ss',
      Math.floor(rep.get('s')) < 10
        ? `0${Math.floor(rep.get('s'))}`
        : `${Math.floor(rep.get('s'))}`,
    )
    .set('second', rep.get('s') === 1 ? 'second' : 'seconds')

  for (let [format, val] of rep)
    text = text.replace(
      new RegExp(`{${format}}`, 'g'),
      typeof val === 'number' ? Math.floor(val) : val,
    )

  return text
}
