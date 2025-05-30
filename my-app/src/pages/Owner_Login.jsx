import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // ✅ React Router 내장 훅

  useEffect(() => {
    fetch('http://localhost:8080/auth/store', {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data?.data?.storeId) {
          // ✅ 이미 로그인된 경우 자동 이동
          navigate(`/owner/dashboard/${data.data.storeId}`);
        }
      })
      .catch(err => {
        console.log('자동 로그인 체크 실패:', err);
      });
  }, [navigate]);

  const handleSocialLogin = (provider) => {
    let redirectUrl = '';
    switch (provider) {
      case 'kakao':
        redirectUrl = `http://localhost:8080/api/oauth2/kakao/login`;
        break;
      case 'naver':
        redirectUrl = `http://localhost:8080/api/oauth2/naver/login`;
        break;
      default:
        break;
    }
    window.location.href = redirectUrl;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:8080/api/stores/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ownerEmail: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`로그인 실패: ${data.error || '알 수 없는 오류'}`);
        return;
      }

      alert('로그인 성공!');
      // ✅ 쿼리 → 경로 파라미터 방식으로 수정
      navigate(`/owner/dashboard/${data.storeId}`);
    } catch (err) {
      alert('로그인 중 오류 발생: ' + err.message);
    }
  };

  const handleSignUp = () => {
    navigate('/signup'); // ✅ 이 부분도 SPA 방식으로 자연스럽게 처리
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-100">
      <div className="w-full max-w-sm space-y-6 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-center">로그인</h1>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            이메일로 로그인
          </button>
        </form>

        <div className="flex justify-between">
          <button
            onClick={handleSignUp}
            className="text-sm text-blue-600 hover:underline"
          >
            회원가입
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleSocialLogin('kakao')}
            className="w-full flex items-center justify-center bg-yellow-400 text-black py-3 rounded shadow"
          >
            Kakao로 시작하기
          </button>
          <button
            onClick={() => handleSocialLogin('naver')}
            className="w-full flex items-center justify-center bg-green-500 text-white py-3 rounded shadow"
          >
            Naver로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
