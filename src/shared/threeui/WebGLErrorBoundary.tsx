import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class WebGLErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ThreeUI WebGL Fallback kích hoạt:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-gradient-to-br from-noir-900 via-noir-850 to-noir-950 border border-white/5 p-8 text-center">
            <div>
              <div className="w-8 h-8 mx-auto mb-3 rounded-full border border-champagne/40 flex items-center justify-center text-champagne text-xs">
                3D
              </div>
              <p className="font-serif italic text-lg text-platinum-light tracking-wide">
                Kho Lưu Trữ Hình Ảnh Atelier Vérité
              </p>
              <p className="text-xs uppercase tracking-widest text-platinum-dark mt-1">
                Chế độ hiển thị tĩnh đang hoạt động
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
