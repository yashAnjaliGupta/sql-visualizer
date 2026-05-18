import ThemeToggle from "./ThemeToggle";
import logo from "../assets/logo.svg"

type HeaderProps = {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
};

function Header({ isDarkMode, setIsDarkMode }: HeaderProps) {
    return(
        <div className="w-full h-20 px-6 flex items-center justify-between rounded-3xl bg-[var(--surface)]/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-4">
                {/* LOGO */}
                <div className=" w-18 h-18 rounded-2xl flex items-center justify-center bg-gradient-to-br" >
                    <img src={logo} alt="SQL Visualizer" className="w-18 h-18 object-contain"/>
                </div>
                {/* TITLE */}
                <div>
                    <h1 className=" text-2xl font-bold tracking-tight text-[var(--text)]" >
                        SQL Visualizer
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Query Relationship Explorer
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
            {/* GITHUB BUTTON */}
                <a
                    href="https://github.com/yashAnjaliGupta/sql-visualizer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                        group

                        w-11
                        h-11

                        rounded-2xl

                        flex
                        items-center
                        justify-center

                        bg-[var(--surface-2)]

                        border
                        border-[var(--border)]

                        text-[var(--text-secondary)]

                        hover:text-white
                        hover:bg-blue-500
                        hover:border-blue-500

                        transition-all
                        duration-200

                        shadow-sm
                        hover:shadow-lg
                        hover:shadow-blue-500/20
                    "
                    title="View on GitHub"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="
                            w-5
                            h-5

                            transition-transform
                            duration-200

                            group-hover:scale-110
                        "
                    >
                        <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.66-.22.66-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.2-3.37-1.2-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .08 1.53 1.06 1.53 1.06.9 1.58 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.74 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0112 6.84c.85 0 1.71.12 2.51.35 1.9-1.33 2.74-1.05 2.74-1.05.56 1.43.21 2.48.1 2.74.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.82-4.57 5.08.36.32.68.94.68 1.89 0 1.36-.01 2.46-.01 2.8 0 .27.17.59.67.49A10.25 10.25 0 0022 12.25C22 6.58 17.52 2 12 2z" />
                    </svg>
                </a>
            <ThemeToggle 
                isDark={isDarkMode} 
                onToggle={() => setIsDarkMode(!isDarkMode)} 
            />
            </div>
        </div>
    )
}
export default Header;