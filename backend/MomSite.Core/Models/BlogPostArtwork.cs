namespace MomSite.Core.Models;

public class BlogPostArtwork
{
    public int BlogPostId { get; set; }
    public BlogPost BlogPost { get; set; } = null!;

    public int ArtworkId { get; set; }
    public Artwork Artwork { get; set; } = null!;

    public int SortOrder { get; set; }
}
