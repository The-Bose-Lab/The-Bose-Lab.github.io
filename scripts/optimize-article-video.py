"""Encode full-detail article loops for hardware decoding; verify every frame.

Requires Pillow and imageio-ffmpeg. The original WebP files remain as the
no-JavaScript fallback. The fixed page background replaces transparency.
2x nearest-neighbour encoding gives each source pixel its own 4:2:0 chroma
sample, preserving the fine coloured molecular outlines.
"""
import json
from pathlib import Path
import subprocess
import imageio_ffmpeg
from PIL import Image, ImageChops, ImageStat

root = Path(__file__).resolve().parents[1]
directory = root / 'public/assets/blog/normalizing-flow-maps'
encoder = imageio_ffmpeg.get_ffmpeg_exe()
report = []
for name in ['WY-md-transparent', 'chignolin-md-transparent']:
    source = directory / (name + '.webp')
    target = directory / (name + '.mp4')
    with Image.open(source) as image:
        width, height = image.size
        def frame(index):
            image.seek(index)
            rgba = image.convert('RGBA')
            background = Image.new('RGB', image.size, '#FCFCF4')
            background.paste(rgba, mask=rgba.getchannel('A'))
            return background
        first = frame(0)
        first.save(directory / (name + '-poster.webp'), 'WEBP', lossless=True, exact=True)
        duration = image.info['duration']
        command = [encoder, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
                   '-s', f'{width}x{height}', '-r', str(1000 / duration), '-i', '-',
                   '-an', '-vf', 'scale=iw*2:ih*2:flags=neighbor', '-c:v', 'libx264',
                   '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
                   '-movflags', '+faststart', str(target)]
        process = subprocess.Popen(command, stdin=subprocess.PIPE)
        for index in range(image.n_frames):
            pixels = frame(index)
            assert image.info['duration'] == duration, 'Variable timing needs explicit timestamps'
            process.stdin.write(pixels.tobytes())
        process.stdin.close()
        assert process.wait() == 0
        # Compare all decoded frames in the original display pixel grid.
        decode = subprocess.Popen([encoder, '-v', 'error', '-i', str(target),
            '-vf', f'scale={width}:{height}:flags=neighbor', '-f', 'rawvideo',
            '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
        average, peak_mean = 0, 0
        for index in range(image.n_frames):
            raw = decode.stdout.read(width * height * 3)
            assert len(raw) == width * height * 3
            actual = Image.frombytes('RGB', (width, height), raw)
            mean = sum(ImageStat.Stat(ImageChops.difference(frame(index), actual)).mean) / 3
            average += mean
            peak_mean = max(peak_mean, mean)
        assert not decode.stdout.read(1), 'Unexpected extra frames'
        assert decode.wait() == 0
        average /= image.n_frames
        assert peak_mean < 2.0, f'Visible colour error is too high: {peak_mean}'
        record = dict(name=name, frames=image.n_frames, duration_ms=image.n_frames*duration,
                      source_size=[width,height], encoded_size=[width*2,height*2],
                      source_bytes=source.stat().st_size, video_bytes=target.stat().st_size,
                      mean_rgb_error=round(average,4), max_frame_mean_rgb_error=round(peak_mean,4))
        report.append(record)
        print(json.dumps(record), flush=True)
(root/'tests/fixtures/article-video-report.json').write_text(json.dumps(report, indent=2)+'\n')
