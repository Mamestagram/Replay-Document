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

        print(int(self.frame_bundle.action))

        current_time = -6974
        trash = ""

        if self.frame_bundle.action in (ReplayAction.Skip, ReplayAction.NewSong):
            player.last_sec = -6974
            player.replay_ = ""
            print("reset")
            return

        for rep in self.frame_bundle.replay_frames:

            current_time = rep.time
            x = "{:.5f}".format(rep.x)
            y = "{:.5f}".format(rep.y)

            if player.last_sec == -6974:
                player.replay_current_sec = rep.time
            trash += f"{rep.time + 1}|{x}|{y}|{rep.button_state},"
            player.last_sec = rep.time

        player.replay_ += trash

        if current_time - player.replay_current_sec > 10000:
            player.replay_current_sec = current_time
            # wip: これをrequestにする (webに)
            print(player.replay_)

            # 本番環境では下のコメントアウトを解除する
            # player.replay_ = ""

        # enqueue the data
        # to all spectators.
        for spectator in player.spectators:
            spectator.enqueue(data)
