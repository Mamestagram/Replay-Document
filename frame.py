@register(ClientPackets.SPECTATE_FRAMES)
class SpectateFrames(BasePacket):
    def __init__(self, reader: BanchoPacketReader) -> None:
        self.frame_bundle = reader.read_replayframe_bundle()

    async def handle(self, player: Player) -> None:
        # TODO: perform validations on the parsed frame bundle
        # to ensure it's not being tamperated with or weaponized.

        # NOTE: this is given a fastpath here for efficiency due to the
        # sheer rate of usage of these packets in spectator mode.

        # data = app.packets.spectateFrames(self.frame_bundle.raw_data)
        data = (
            struct.pack("<HxI", 15, len(self.frame_bundle.raw_data))
            + self.frame_bundle.raw_data
        )

        last_sec = -6974
        current_time = -6974
        trash = ""

        for rep in self.frame_bundle.replay_frames:
            if last_sec == -6974:
                current_time = rep.time
                if rep.time < 1000:
                    player.replay_current_sec = rep.time
                last_sec = rep.time

                y = "{:.5f}".format(rep.y)
                trash += f"{rep.time + 1}|{int(rep.x)}|{y}|{rep.button_state},\n"
            else:
                time = abs(last_sec - rep.time)
                y = "{:.5f}".format(rep.y)
                trash += f"{time}|{int(rep.x)}|{y}|{rep.button_state},\n"
                last_sec = rep.time
        player.replay_ += trash

        if current_time - player.replay_current_sec > 10000:
            player.replay_current_sec = current_time
            # wip: これをrequestにする (webに)
            print(player.replay_)
            player.replay_ = ""