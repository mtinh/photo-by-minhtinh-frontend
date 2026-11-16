import { BrowserRouter, Routes, Route } from 'react-router-dom'

import PhotoStudio from "./components/PhotoStudio/PhotoStudio";
import Home from "./components/PhotoStudio/Home/Home";
import About from "./components/PhotoStudio/About/About";
import CategoryProduct from "./components/PhotoStudio/CategoryProduct/CategoryProduct";
import ProductList from "./components/PhotoStudio/ProductList/ProductList";
import ProductDetail from "./components/PhotoStudio/ProductDetail/ProductDetail";
import Cart from "./components/PhotoStudio/Cart/Cart";
import Checkout from "./components/PhotoStudio/Checkout/Checkout";
import Orders from "./components/PhotoStudio/Orders/Orders";
import OrderDetail from "./components/PhotoStudio/OrderDetail/OrderDetail";
import MyPhotos from "./components/PhotoStudio/MyPhotos/MyPhotos";
import Profile from "./components/PhotoStudio/Profile/Profile";
import Gallery from "./components/PhotoStudio/Gallery/Gallery";
import NotFound from "./components/PhotoStudio/NotFound/NotFound";

import Auth from "./components/Auth/Auth";
import Login from "./components/Auth/Login/Login";
import Register from "./components/Auth/Register/Register";
import ForgotPassword from "./components/Auth/ForgotPassword/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword/ResetPassword";

import Admin from "./components/Admin/Admin";
import Dashboard from "./components/Admin/Dashboard/Dashboard";
import ListProduct from "./components/Admin/ListProduct/ListProduct";
import DetailProductEdit from "./components/Admin/DetailProductEdit/DetailProductEdit";
import ListCategory from "./components/Admin/ListCategory/ListCategory";
import ListOrder from "./components/Admin/ListOrder/ListOrder";
import DetailOrder from "./components/Admin/DetailOrder/DetailOrder";
import ListUsers from "./components/Admin/ListUsers/ListUsers";
import Photos from "./components/Admin/Photos/Photos";
import ListAlbum from "./components/Admin/ListAlbum/ListAlbum";
import DetailAlbum from "./components/Admin/DetailAlbum/DetailAlbum";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";

import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <CartProvider>
                            <Routes>

                                <Route element={<PhotoStudio />}>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/category/:slug" element={<CategoryProduct />} />
                                    <Route path="/products" element={<ProductList />} />
                                    <Route path="/products/:slug" element={<ProductDetail />} />
                                    <Route path="/cart" element={<Cart />} />
                                    <Route path="/checkout" element={<Checkout />} />
                                    <Route path="/orders" element={<Orders />} />
                                    <Route path="/orders/:code" element={<OrderDetail />} />
                                    <Route path="/my-photos" element={<MyPhotos />} />
                                    <Route path="/profile" element={<Profile />} />
                                    <Route path="*" element={<NotFound />} />
                                </Route>

                                <Route element={<Auth />}>
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/forgot-password" element={<ForgotPassword />} />
                                    <Route path="/reset-password" element={<ResetPassword />} />
                                </Route>

                                <Route element={<Admin />}>
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/list-product" element={<ListProduct />} />
                                    <Route path="/insert-product" element={<DetailProductEdit />} />
                                    <Route path="/detail-product/:id/edit" element={<DetailProductEdit />} />
                                    <Route path="/list-category" element={<ListCategory />} />
                                    <Route path="/list-order" element={<ListOrder />} />
                                    <Route path="/detail-order/:id" element={<DetailOrder />} />
                                    <Route path="/users" element={<ListUsers />} />
                                    <Route path="/photos" element={<Photos filter="all" />} />
                                    <Route path="/photos/favorites" element={<Photos filter="favorites" />} />
                                    <Route path="/photos/trash" element={<Photos filter="trash" />} />
                                    <Route path="/photos/search" element={<Photos filter="search" />} />
                                    <Route path="/list-album" element={<ListAlbum />} />
                                    <Route path="/detail-album/:id" element={<DetailAlbum />} />
                                </Route>

                                <Route path="/g/:slug" element={<Gallery />} />

                            </Routes>
                        </CartProvider>
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
