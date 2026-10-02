using Microsoft.EntityFrameworkCore;
using MomSite.Core.Interfaces;
using MomSite.Core.Models;
using MomSite.Infrastructure.Data;

namespace MomSite.Infrastructure.Blog;

internal static class BlogCategoryOperations
{
    public static async Task<BlogResult<BlogCategory>> CreateAsync(ApplicationDbContext db, BlogCategoryInput input)
    {
        var errors = await ValidateAsync(db, input, 0);
        if (errors.Count > 0) return BlogResult<BlogCategory>.Invalid(errors);
        var category = new BlogCategory();
        Apply(category, input);
        db.BlogCategories.Add(category);
        await db.SaveChangesAsync();
        return BlogResult<BlogCategory>.Ok(category);
    }

    public static async Task<BlogResult<BlogCategory>> UpdateAsync(ApplicationDbContext db, int id, BlogCategoryInput input)
    {
        var category = await db.BlogCategories.FindAsync(id);
        if (category == null) return BlogResult<BlogCategory>.NotFound();
        var errors = await ValidateAsync(db, input, id);
        if (errors.Count > 0) return BlogResult<BlogCategory>.Invalid(errors);
        Apply(category, input);
        await db.SaveChangesAsync();
        return BlogResult<BlogCategory>.Ok(category);
    }

    public static async Task<BlogResult<bool>> DeleteAsync(ApplicationDbContext db, int id)
    {
        var category = await db.BlogCategories.FindAsync(id);
        if (category == null) return BlogResult<bool>.NotFound();
        var count = await db.BlogPosts.CountAsync(p => p.BlogCategoryId == id);
        if (count > 0) return BlogResult<bool>.Conflict(BlogConflict.CategoryNotEmpty, count);
        db.BlogCategories.Remove(category);
        await db.SaveChangesAsync();
        return BlogResult<bool>.Ok(true);
    }

    private static async Task<Dictionary<string, string>> ValidateAsync(ApplicationDbContext db, BlogCategoryInput input, int id)
    {
        var errors = new Dictionary<string, string>();
        if (string.IsNullOrWhiteSpace(input.Name) || input.Name.Trim().Length > 100)
            errors["name"] = "Название рубрики: от 1 до 100 символов.";
        if (input.Slug == null || input.Slug.Length > 80 || !BlogSlug.IsValid(input.Slug))
            errors["slug"] = "Адрес: только латинские буквы, цифры и дефис.";
        else if (await db.BlogCategories.AnyAsync(c => c.Slug == input.Slug && c.Id != id))
            errors["slug"] = "Рубрика с таким адресом уже есть.";
        if (input.Description != null && input.Description.Length > 1000)
            errors["description"] = "Описание длиннее 1000 символов — сократите.";
        return errors;
    }

    private static void Apply(BlogCategory category, BlogCategoryInput input)
    {
        category.Name = input.Name.Trim();
        category.Slug = input.Slug;
        category.Description = string.IsNullOrWhiteSpace(input.Description) ? null : input.Description.Trim();
        category.DisplayOrder = input.DisplayOrder;
    }
}
