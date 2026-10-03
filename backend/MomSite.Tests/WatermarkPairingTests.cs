namespace MomSite.Tests
{
    public class WatermarkPairingTests
    {
        private static readonly DateTime T = new(2026, 10, 1, 10, 0, 0, DateTimeKind.Utc);
        private static StorageObject O(string key, double sec) => new(key, T.AddSeconds(sec));

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_ExactPair_Matched()
        {
            var r = WatermarkPairing.Match(new[] { O("artworks/a.jpg", 0) }, new[] { O("artworks/watermarked_b.jpg", 3) });
            Assert.Equal("artworks/a.jpg", r["artworks/watermarked_b.jpg"]);
        }

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_OriginalLaterThanCopy_NoPair()
        {
            var r = WatermarkPairing.Match(new[] { O("artworks/a.jpg", 5) }, new[] { O("artworks/watermarked_b.jpg", 3) });
            Assert.Empty(r);
        }

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_Over120Seconds_NoPair_ButExactly120_Pairs()
        {
            Assert.Empty(WatermarkPairing.Match(new[] { O("artworks/a.jpg", 0) }, new[] { O("artworks/watermarked_b.jpg", 121) }));
            Assert.Single(WatermarkPairing.Match(new[] { O("artworks/a.jpg", 0) }, new[] { O("artworks/watermarked_b.jpg", 120) }));
        }

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_DifferentExtension_NoPair()
        {
            var r = WatermarkPairing.Match(new[] { O("artworks/a.png", 0) }, new[] { O("artworks/watermarked_b.jpg", 3) });
            Assert.Empty(r);
        }

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_TwoCandidates_NearestChosen_OriginalNotReused()
        {
            var originals = new[] { O("artworks/far.jpg", 0), O("artworks/near.jpg", 8) };
            var copies = new[] { O("artworks/watermarked_1.jpg", 10), O("artworks/watermarked_2.jpg", 11) };

            var r = WatermarkPairing.Match(originals, copies);

            Assert.Equal("artworks/near.jpg", r["artworks/watermarked_1.jpg"]);
            Assert.Equal("artworks/far.jpg", r["artworks/watermarked_2.jpg"]);
            Assert.Equal(2, r.Values.Distinct().Count());
        }

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_SingleOriginalForTwoCopies_OnlyOneCopyGetsIt()
        {
            var r = WatermarkPairing.Match(new[] { O("artworks/a.jpg", 0) },
                new[] { O("artworks/watermarked_1.jpg", 2), O("artworks/watermarked_2.jpg", 4) });
            Assert.Single(r);
            Assert.True(r.ContainsKey("artworks/watermarked_1.jpg"));
        }

        [Theory, Trait("scenario", "US7-BE1")]
        [InlineData("2026/10/02/abc_artworks/watermarked_x.jpg", true, false)]
        [InlineData("2026/10/02/abc_artworks/x.jpg", false, true)]
        [InlineData("artworks/watermarked_x.jpg", true, false)]
        [InlineData("2026/10/02/abc_thumbnails/thumb_x.jpg", false, false)]
        public void US7_BE1_Classification_ByKey(string key, bool copy, bool original)
        {
            Assert.Equal(copy, WatermarkPairing.IsCopy(key));
            Assert.Equal(original, WatermarkPairing.IsOriginal(key));
        }

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_EmptyOriginals_NoPairs()
        {
            var r = WatermarkPairing.Match(Array.Empty<StorageObject>(), new[] { O("artworks/watermarked_b.jpg", 3) });
            Assert.Empty(r);
        }

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_EmptyCopies_NoPairs()
        {
            var r = WatermarkPairing.Match(new[] { O("artworks/a.jpg", 0) }, Array.Empty<StorageObject>());
            Assert.Empty(r);
        }

        [Fact, Trait("scenario", "US7-BE1")]
        public void US7_BE1_MultipleOriginalsAndCopies_SameExtension_Paired()
        {
            var originals = new[] { O("g1/a.jpg", 0), O("g2/b.jpg", 10) };
            var copies = new[] { O("g1/watermarked_x.jpg", 3), O("g2/watermarked_y.jpg", 13) };

            var r = WatermarkPairing.Match(originals, copies);

            Assert.Equal(2, r.Count);
            Assert.Equal("g1/a.jpg", r["g1/watermarked_x.jpg"]);
            Assert.Equal("g2/b.jpg", r["g2/watermarked_y.jpg"]);
        }
    }
}
