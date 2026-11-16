import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import cartReducer, { CLEAR_CART, initialCart, SET_CART, UPDATE_QUANTITY } from "../reducer/cartReducer";
import cartService from "../services/cartService";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
    const { user } = useAuth();
    const [cart, dispatch] = useReducer(cartReducer, initialCart);
    const canUseCart = !!user && user.role === "CUSTOMER";

    const reloadCart = useCallback(async () => {
        if (!canUseCart) return dispatch({ type: CLEAR_CART });
        try {
            const res = await cartService.getCart();
            dispatch({ type: SET_CART, payload: res.data });
        } catch (err) {
            console.error("Lỗi tải giỏ hàng:", err);
        }
    }, [canUseCart]);

    useEffect(() => {
        reloadCart();
    }, [reloadCart]);

    const addToCart = async (productId, quantity = 1) => {
        const res = await cartService.addToCart(productId, quantity);
        dispatch({ type: SET_CART, payload: res.data });
        return res;
    };

    const updateQuantity = async (productId, quantity) => {
        const previous = cart;
        dispatch({ type: UPDATE_QUANTITY, payload: { id: productId, quantity } });
        try {
            const res = await cartService.updateQuantity(productId, quantity);
            dispatch({ type: SET_CART, payload: res.data });
        } catch (err) {
            dispatch({ type: SET_CART, payload: previous });
            throw err;
        }
    };

    const removeFromCart = async (productId) => {
        const res = await cartService.removeFromCart(productId);
        dispatch({ type: SET_CART, payload: res.data });
    };

    const value = { cart, canUseCart, reloadCart, addToCart, updateQuantity, removeFromCart };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    return useContext(CartContext);
}
