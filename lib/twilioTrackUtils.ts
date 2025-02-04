import { LocalAudioTrack, LocalVideoTrack, RemoteAudioTrack, RemoteVideoTrack } from 'twilio-video';

export function attachVideoTrack(track: LocalVideoTrack | RemoteVideoTrack, container: HTMLDivElement) {
  const el = track.attach(); // returns <video> or <audio>
  container.appendChild(el);
}

export function stopAndDetachTrack(track: LocalVideoTrack | RemoteVideoTrack | LocalAudioTrack | RemoteAudioTrack) {
  if (track.kind === 'video') {
    const videoTrack = track as LocalVideoTrack | RemoteVideoTrack;
    if ('stop' in videoTrack) {
      videoTrack.stop();
    }
    videoTrack.detach().forEach((el) => el.remove());
  } else if (track.kind === 'audio') {
    const audioTrack = track;
    if ('stop' in audioTrack) {
      audioTrack.stop();
    }
  }
}
