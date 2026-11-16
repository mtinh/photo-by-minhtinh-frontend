import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import productService from "../../../services/productService";
import ProductList from "../ProductList/ProductList";

import "./CategoryProduct.css";

const CategoryProduct = () => {

    const { slug } = useParams();
    const [category, setCategory] = useState(null);

    useEffect(() => {
        productService
            .getCategories()
            .then((res) => setCategory((res.data ?? []).find((c) => c.slug === slug) ?? null))
            .catch(() => setCategory(null));
    }, [slug]);

    return (
        <div className="category-product">
            {category?.description && <p className="container category-description">{category.description}</p>}
            <ProductList key={slug} categorySlug={slug} title={category?.name ?? "Danh mục"} />
        </div>
    );
}

export default CategoryProduct;
