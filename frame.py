@register(ClientPackets.CHANGE_ACTION, restricted=True)
class ChangeAction(BasePacket):
    def __init__(self, reader: BanchoPacketReader) -> None:
        self.action = reader.read_u8()
        self.info_text = reader.read_string()
        self.map_md5 = reader.read_string()

        self.mods = reader.read_u32()
        self.mode = reader.read_u8()
        if self.mods & Mods.RELAX:
            if self.mode == 3:  # rx!mania doesn't exist
                self.mods &= ~Mods.RELAX
            else:
                self.mode += 4
        elif self.mods & Mods.AUTOPILOT:
            if self.mode in (1, 2, 3):  # ap!catch, taiko and mania don't exist
                self.mods &= ~Mods.AUTOPILOT
            else:
                self.mode += 8

        self.map_id = reader.read_i32()

    async def handle(self, player: Player) -> None:
        # update the user's status.
        player.status.action = Action(self.action)
        player.status.info_text = self.info_text
        player.status.map_md5 = self.map_md5
        player.status.mods = Mods(self.mods)
        player.status.mode = GameMode(self.mode)
        player.status.map_id = self.map_id

        print("action: ", self.action)

        # 本番環境はself.action 12のみにする
        if self.action in (2, 12):
            if app.state.sessions.bot not in player.spectators:
                player.add_spectator(app.state.sessions.bot)
        else:
            if app.state.sessions.bot in player.spectators:
                player.last_sec = -6974
                # debug

                test_file = pathlib.Path.cwd() / "test.txt"
                test_file.write_text(player.replay_)

                player.replay_ = ""

                player.remove_spectator(app.state.sessions.bot)

        # broadcast it to all online players.
        if not player.restricted:
            app.state.sessions.players.enqueue(app.packets.user_stats(player))

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
