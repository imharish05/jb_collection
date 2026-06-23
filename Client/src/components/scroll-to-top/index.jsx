import useScrollTop from "../../hooks/use-scroll-top";

const ScrollToTop = () => {
    const { stick, onClickHandler } = useScrollTop();
    return (
        <>
            <a
                href="https://wa.me/917338814319"
                className={`whatsapp-float ${stick ? "has-scroll" : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact us on WhatsApp"
            >
                <i className="fa fa-whatsapp"></i>
            </a>
            {stick && (
                <button
                    aria-label="Scroll to top"
                    type="button"
                    className="scroll-top"
                    onClick={onClickHandler}
                >
                    <i className="fa fa-angle-double-up"></i>
                </button>
            )}
        </>
    );
};

export default ScrollToTop;
