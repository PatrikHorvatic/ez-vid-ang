import { vi } from "vitest";
import { validateTracks } from "./utilities";
import { EvaTrack } from "../types";

describe("validateTracks", () => {
  it("drops subtitle tracks missing srclang and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const tracks: EvaTrack[] = [{ kind: "subtitles", srclang: "en", label: "English", src: "en.vtt" }, { kind: "subtitles", label: "No language", src: "unknown.vtt" } as EvaTrack];

    const result = validateTracks(tracks);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ srclang: "en" });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("keeps caption tracks without srclang, since it's optional for captions", () => {
    const tracks: EvaTrack[] = [{ kind: "captions", label: "Captions", src: "captions.vtt" }];

    const result = validateTracks(tracks);

    expect(result).toHaveLength(1);
  });

  it("only keeps the first track marked default when multiple claim it", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const tracks: EvaTrack[] = [
      { kind: "subtitles", srclang: "en", label: "English", src: "en.vtt", default: true },
      { kind: "subtitles", srclang: "fr", label: "French", src: "fr.vtt", default: true },
    ];

    const result = validateTracks(tracks);

    expect(result.filter((t) => t.default)).toHaveLength(1);
    expect(result[0].default).toBe(true);
    expect(result[1].default).toBe(false);
    warnSpy.mockRestore();
  });

  it("removes duplicate tracks with the same kind, srclang, and label", () => {
    const tracks: EvaTrack[] = [
      { kind: "subtitles", srclang: "en", label: "English", src: "en.vtt" },
      { kind: "subtitles", srclang: "en", label: "English", src: "en-2.vtt" },
    ];

    const result = validateTracks(tracks);

    expect(result).toHaveLength(1);
  });

  it("returns an empty array unchanged", () => {
    expect(validateTracks([])).toEqual([]);
  });
});
