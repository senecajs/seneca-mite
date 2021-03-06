"use strict"

module.exports = function( options ) {
  var seneca = this;
  var name = 'ProtocolCtrlV1'
  var protocol_version = seneca.export( 'constants/protocol_version' )

  function command( args, response ) {
    var that = this
    var command = args.command
    that.act( "role: 'crypt', decrypt: 'message'", {message: command}, function(err, decrypt){

      var message
      try {
        message = JSON.parse( decrypt.message )
      } catch ( err ) {
        that.log.debug("Cannot parse message", decrypt.message)
        return response( null, {err: true, msg: 'Received unexpected response: ' + decrypt.message} )
      }

      that.act( "role:'protocol_v1',generate:'response'",
        {
          command: message.command
        },
        function(err, data){
          if (err){
            return response(err)
          }
          that.act( "role: 'crypt', encrypt: 'message'", {message: JSON.stringify(data)}, function(err, encrypt){
            response(err, {response: encrypt.message})
          })
        }

      )
    } )
  }

  seneca
    .add( {role: name, cmd: 'command'}, command )

  seneca.act( {role: 'web', use: {
    name: name,
    prefix: '/mite/',
    pin: {role: name, cmd: '*'},
    map: {
      command: {POST: true, alias: 'v1/command'}
    }
  }} )
}