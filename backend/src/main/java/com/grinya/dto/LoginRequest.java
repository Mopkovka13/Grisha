package com.grinya.dto;

public class LoginRequest {
    private String password;

    public LoginRequest() {}

    public LoginRequest(String password) {
        this.password = password;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
