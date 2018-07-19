from twisted.internet import reactor
from twisted.web.server import Site
from twisted.web.resource import Resource
from twisted.web.static import File
import mido
import cgi

class Midi(Resource):
    def render_GET(self, request):
        args = request.args
        command = args["command"][0]
        note = cgi.escape(args["note"][0])
        velocity = cgi.escape(args["velocity"][0])
        output.send(mido.Message(command, note=int(note), velocity=int(velocity)))
        print '<html><body>command: %s, note: %s, velocity: %s</body></html>' % (command, note, velocity)
        #return '<html><body>command: %s, note: %s, velocity: %s</body></html>' % (command, note, velocity)
        return ''



output = mido.open_output('MidiSport 1x1:MidiSport 1x1 MIDI 1 20:0')
root = Resource()
root.putChild("midi", Midi())
root.putChild("piano.html", File("piano.html"))
root.putChild("main.css", File("main.css"))
factory = Site(root)
reactor.listenTCP(8080, factory)
reactor.run()
output.close()

